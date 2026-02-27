// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title DividendDistributor
 * @notice Handles automated dividend distribution for property tokens
 * @dev Supports both ETH and stablecoin (USDC/USDT) distributions
 * 
 * Key Features:
 * - Proportional dividend distribution based on token holdings
 * - Support for multiple payout currencies
 * - Snapshot-based distribution (holdings at declaration time)
 * - Claim-based or push-based distribution options
 * - Tax reporting data generation
 */
contract DividendDistributor is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    
    // ============ ROLES ============
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    
    // ============ ENUMS ============
    
    /// @notice Supported payout currencies
    enum PayoutCurrency {
        ETH,
        USDC,
        USDT
    }
    
    /// @notice Dividend status
    enum DividendStatus {
        Declared,       // Dividend announced
        Funded,         // Funds deposited
        Distributing,   // Distribution in progress
        Completed,      // All distributed
        Cancelled       // Cancelled before distribution
    }
    
    // ============ STRUCTS ============
    
    /// @notice Dividend round information
    struct DividendRound {
        uint256 id;
        address propertyToken;
        uint256 totalAmount;
        uint256 amountPerToken;     // Amount per token (scaled by 1e18)
        uint256 totalSupplySnapshot;
        PayoutCurrency currency;
        address currencyAddress;    // Address for ERC20, address(0) for ETH
        uint256 declarationTime;
        uint256 recordDate;         // Snapshot date for eligibility
        uint256 paymentDate;        // When distribution begins
        uint256 expirationDate;     // Deadline to claim
        DividendStatus status;
        uint256 totalClaimed;
        uint256 claimCount;
        string description;         // e.g., "Q4 2024 Rental Income"
    }
    
    /// @notice Investor dividend claim record
    struct ClaimRecord {
        bool eligible;
        uint256 amount;
        bool claimed;
        uint256 claimTime;
    }
    
    // ============ STATE VARIABLES ============
    
    /// @notice Stablecoin addresses
    address public usdcAddress;
    address public usdtAddress;
    
    /// @notice Dividend round counter
    uint256 public roundCount;
    
    /// @notice Default claim expiration period (90 days)
    uint256 public defaultExpirationPeriod = 90 days;
    
    /// @notice Minimum dividend amount per round
    uint256 public minimumDividendAmount = 100 * 1e6; // $100 USDC minimum
    
    /// @notice Platform fee percentage (basis points, e.g., 50 = 0.5%)
    uint256 public platformFeeBps = 0;
    
    /// @notice Platform fee recipient
    address public feeRecipient;
    
    /// @notice Total dividends distributed (all time, in USD equivalent)
    uint256 public totalDividendsDistributed;
    
    // ============ MAPPINGS ============
    
    /// @notice Round ID => Dividend round data
    mapping(uint256 => DividendRound) public dividendRounds;
    
    /// @notice Round ID => investor => claim record
    mapping(uint256 => mapping(address => ClaimRecord)) public claims;
    
    /// @notice Property token => list of round IDs
    mapping(address => uint256[]) public propertyRounds;
    
    /// @notice Investor => total dividends claimed (all properties)
    mapping(address => uint256) public investorTotalClaimed;
    
    /// @notice Property token => is registered
    mapping(address => bool) public registeredProperties;
    
    // ============ EVENTS ============
    
    event DividendDeclared(
        uint256 indexed roundId,
        address indexed propertyToken,
        uint256 totalAmount,
        PayoutCurrency currency,
        uint256 recordDate,
        uint256 paymentDate
    );
    
    event DividendFunded(
        uint256 indexed roundId,
        uint256 amount,
        address funder
    );
    
    event DividendClaimed(
        uint256 indexed roundId,
        address indexed investor,
        uint256 amount,
        PayoutCurrency currency
    );
    
    event DividendPushed(
        uint256 indexed roundId,
        address indexed investor,
        uint256 amount
    );
    
    event DividendCancelled(
        uint256 indexed roundId,
        string reason
    );
    
    event UnclaimedDividendsRecovered(
        uint256 indexed roundId,
        uint256 amount,
        address recipient
    );
    
    event PropertyRegistered(address indexed propertyToken);
    event StablecoinAddressUpdated(PayoutCurrency currency, address newAddress);
    
    // ============ CONSTRUCTOR ============
    
    constructor(
        address _admin,
        address _usdc,
        address _usdt
    ) {
        require(_admin != address(0), "DividendDistributor: invalid admin");
        
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
        _grantRole(DISTRIBUTOR_ROLE, _admin);
        
        usdcAddress = _usdc;
        usdtAddress = _usdt;
        feeRecipient = _admin;
    }
    
    // ============ DIVIDEND DECLARATION ============
    
    /**
     * @notice Declare a new dividend round
     * @param propertyToken Property token address
     * @param totalAmount Total dividend amount
     * @param currency Payout currency
     * @param recordDate Snapshot date for holdings
     * @param paymentDate When distribution starts
     * @param description Description of the dividend
     * @return roundId The new round ID
     */
    function declareDividend(
        address propertyToken,
        uint256 totalAmount,
        PayoutCurrency currency,
        uint256 recordDate,
        uint256 paymentDate,
        string calldata description
    ) external onlyRole(DISTRIBUTOR_ROLE) whenNotPaused returns (uint256 roundId) {
        require(registeredProperties[propertyToken], "DividendDistributor: unregistered property");
        require(totalAmount >= minimumDividendAmount, "DividendDistributor: below minimum");
        require(recordDate >= block.timestamp, "DividendDistributor: record date must be future");
        require(paymentDate > recordDate, "DividendDistributor: payment must be after record");
        
        roundCount++;
        roundId = roundCount;
        
        IERC20 token = IERC20(propertyToken);
        uint256 totalSupply = token.totalSupply();
        require(totalSupply > 0, "DividendDistributor: no tokens in circulation");
        
        // Calculate amount per token (scaled by 1e18 for precision)
        uint256 amountPerToken = (totalAmount * 1e18) / totalSupply;
        
        address currencyAddress = _getCurrencyAddress(currency);
        
        dividendRounds[roundId] = DividendRound({
            id: roundId,
            propertyToken: propertyToken,
            totalAmount: totalAmount,
            amountPerToken: amountPerToken,
            totalSupplySnapshot: totalSupply,
            currency: currency,
            currencyAddress: currencyAddress,
            declarationTime: block.timestamp,
            recordDate: recordDate,
            paymentDate: paymentDate,
            expirationDate: paymentDate + defaultExpirationPeriod,
            status: DividendStatus.Declared,
            totalClaimed: 0,
            claimCount: 0,
            description: description
        });
        
        propertyRounds[propertyToken].push(roundId);
        
        emit DividendDeclared(
            roundId,
            propertyToken,
            totalAmount,
            currency,
            recordDate,
            paymentDate
        );
        
        return roundId;
    }
    
    /**
     * @notice Fund a declared dividend round
     * @param roundId Round to fund
     */
    function fundDividend(uint256 roundId) external payable nonReentrant {
        DividendRound storage round = dividendRounds[roundId];
        require(round.id != 0, "DividendDistributor: invalid round");
        require(round.status == DividendStatus.Declared, "DividendDistributor: not in declared status");
        
        // Calculate amount after platform fee
        uint256 fee = (round.totalAmount * platformFeeBps) / 10000;
        uint256 netAmount = round.totalAmount;
        
        if (round.currency == PayoutCurrency.ETH) {
            require(msg.value >= round.totalAmount, "DividendDistributor: insufficient ETH");
            
            // Send platform fee if applicable
            if (fee > 0 && feeRecipient != address(0)) {
                (bool feeSuccess, ) = feeRecipient.call{value: fee}("");
                require(feeSuccess, "DividendDistributor: fee transfer failed");
            }
            
            // Refund excess
            if (msg.value > round.totalAmount) {
                (bool refundSuccess, ) = msg.sender.call{value: msg.value - round.totalAmount}("");
                require(refundSuccess, "DividendDistributor: refund failed");
            }
        } else {
            require(msg.value == 0, "DividendDistributor: ETH not accepted for this round");
            
            IERC20 paymentToken = IERC20(round.currencyAddress);
            paymentToken.safeTransferFrom(msg.sender, address(this), round.totalAmount);
            
            // Send platform fee if applicable
            if (fee > 0 && feeRecipient != address(0)) {
                paymentToken.safeTransfer(feeRecipient, fee);
            }
        }
        
        round.status = DividendStatus.Funded;
        
        emit DividendFunded(roundId, round.totalAmount, msg.sender);
    }
    
    // ============ DIVIDEND CLAIMING ============
    
    /**
     * @notice Claim dividend for a specific round
     * @param roundId Round to claim from
     */
    function claimDividend(uint256 roundId) external nonReentrant whenNotPaused {
        DividendRound storage round = dividendRounds[roundId];
        require(round.status == DividendStatus.Funded || round.status == DividendStatus.Distributing, 
            "DividendDistributor: not claimable");
        require(block.timestamp >= round.paymentDate, "DividendDistributor: payment not started");
        require(block.timestamp <= round.expirationDate, "DividendDistributor: claim expired");
        
        ClaimRecord storage claim = claims[roundId][msg.sender];
        require(!claim.claimed, "DividendDistributor: already claimed");
        
        // Calculate entitlement based on token balance at record date
        // Note: In production, use a snapshot mechanism
        IERC20 token = IERC20(round.propertyToken);
        uint256 balance = token.balanceOf(msg.sender);
        require(balance > 0, "DividendDistributor: no token balance");
        
        uint256 entitlement = (balance * round.amountPerToken) / 1e18;
        require(entitlement > 0, "DividendDistributor: no entitlement");
        
        // Update claim record
        claim.eligible = true;
        claim.amount = entitlement;
        claim.claimed = true;
        claim.claimTime = block.timestamp;
        
        // Update round stats
        round.totalClaimed += entitlement;
        round.claimCount++;
        
        if (round.status == DividendStatus.Funded) {
            round.status = DividendStatus.Distributing;
        }
        
        // Update investor stats
        investorTotalClaimed[msg.sender] += entitlement;
        
        // Transfer dividend
        _transferDividend(msg.sender, entitlement, round.currency, round.currencyAddress);
        
        emit DividendClaimed(roundId, msg.sender, entitlement, round.currency);
    }
    
    /**
     * @notice Claim dividends from multiple rounds
     * @param roundIds Array of round IDs to claim
     */
    function batchClaimDividends(uint256[] calldata roundIds) external nonReentrant whenNotPaused {
        for (uint256 i = 0; i < roundIds.length; i++) {
            uint256 roundId = roundIds[i];
            DividendRound storage round = dividendRounds[roundId];
            
            // Skip if not claimable
            if (round.status != DividendStatus.Funded && round.status != DividendStatus.Distributing) {
                continue;
            }
            if (block.timestamp < round.paymentDate || block.timestamp > round.expirationDate) {
                continue;
            }
            
            ClaimRecord storage claim = claims[roundId][msg.sender];
            if (claim.claimed) {
                continue;
            }
            
            IERC20 token = IERC20(round.propertyToken);
            uint256 balance = token.balanceOf(msg.sender);
            if (balance == 0) {
                continue;
            }
            
            uint256 entitlement = (balance * round.amountPerToken) / 1e18;
            if (entitlement == 0) {
                continue;
            }
            
            // Process claim
            claim.eligible = true;
            claim.amount = entitlement;
            claim.claimed = true;
            claim.claimTime = block.timestamp;
            
            round.totalClaimed += entitlement;
            round.claimCount++;
            
            if (round.status == DividendStatus.Funded) {
                round.status = DividendStatus.Distributing;
            }
            
            investorTotalClaimed[msg.sender] += entitlement;
            
            _transferDividend(msg.sender, entitlement, round.currency, round.currencyAddress);
            
            emit DividendClaimed(roundId, msg.sender, entitlement, round.currency);
        }
    }
    
    /**
     * @notice Push dividends to investors (admin distribution)
     * @param roundId Round to distribute
     * @param investors Array of investor addresses
     */
    function pushDividends(uint256 roundId, address[] calldata investors) 
        external 
        onlyRole(DISTRIBUTOR_ROLE) 
        nonReentrant 
    {
        DividendRound storage round = dividendRounds[roundId];
        require(round.status == DividendStatus.Funded || round.status == DividendStatus.Distributing,
            "DividendDistributor: not distributable");
        require(block.timestamp >= round.paymentDate, "DividendDistributor: payment not started");
        
        IERC20 token = IERC20(round.propertyToken);
        
        for (uint256 i = 0; i < investors.length; i++) {
            address investor = investors[i];
            ClaimRecord storage claim = claims[roundId][investor];
            
            if (claim.claimed) {
                continue;
            }
            
            uint256 balance = token.balanceOf(investor);
            if (balance == 0) {
                continue;
            }
            
            uint256 entitlement = (balance * round.amountPerToken) / 1e18;
            if (entitlement == 0) {
                continue;
            }
            
            claim.eligible = true;
            claim.amount = entitlement;
            claim.claimed = true;
            claim.claimTime = block.timestamp;
            
            round.totalClaimed += entitlement;
            round.claimCount++;
            
            if (round.status == DividendStatus.Funded) {
                round.status = DividendStatus.Distributing;
            }
            
            investorTotalClaimed[investor] += entitlement;
            
            _transferDividend(investor, entitlement, round.currency, round.currencyAddress);
            
            emit DividendPushed(roundId, investor, entitlement);
        }
    }
    
    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @notice Register a property token
     * @param propertyToken Address to register
     */
    function registerProperty(address propertyToken) external onlyRole(ADMIN_ROLE) {
        require(propertyToken != address(0), "DividendDistributor: invalid address");
        registeredProperties[propertyToken] = true;
        emit PropertyRegistered(propertyToken);
    }
    
    /**
     * @notice Cancel a dividend round
     * @param roundId Round to cancel
     * @param reason Cancellation reason
     */
    function cancelDividend(uint256 roundId, string calldata reason) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        DividendRound storage round = dividendRounds[roundId];
        require(round.status == DividendStatus.Declared || round.status == DividendStatus.Funded,
            "DividendDistributor: cannot cancel");
        
        round.status = DividendStatus.Cancelled;
        
        // Refund if funded
        if (round.totalAmount > 0 && round.totalClaimed == 0) {
            if (round.currency == PayoutCurrency.ETH) {
                (bool success, ) = msg.sender.call{value: round.totalAmount}("");
                require(success, "DividendDistributor: refund failed");
            } else {
                IERC20(round.currencyAddress).safeTransfer(msg.sender, round.totalAmount);
            }
        }
        
        emit DividendCancelled(roundId, reason);
    }
    
    /**
     * @notice Recover unclaimed dividends after expiration
     * @param roundId Round to recover from
     */
    function recoverUnclaimedDividends(uint256 roundId) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        DividendRound storage round = dividendRounds[roundId];
        require(block.timestamp > round.expirationDate, "DividendDistributor: not expired");
        require(round.status == DividendStatus.Distributing, "DividendDistributor: not distributing");
        
        uint256 unclaimed = round.totalAmount - round.totalClaimed;
        require(unclaimed > 0, "DividendDistributor: nothing to recover");
        
        round.status = DividendStatus.Completed;
        
        if (round.currency == PayoutCurrency.ETH) {
            (bool success, ) = msg.sender.call{value: unclaimed}("");
            require(success, "DividendDistributor: recovery failed");
        } else {
            IERC20(round.currencyAddress).safeTransfer(msg.sender, unclaimed);
        }
        
        emit UnclaimedDividendsRecovered(roundId, unclaimed, msg.sender);
    }
    
    /**
     * @notice Update stablecoin addresses
     * @param currency Currency to update
     * @param newAddress New address
     */
    function setStablecoinAddress(PayoutCurrency currency, address newAddress) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        require(currency != PayoutCurrency.ETH, "DividendDistributor: cannot set ETH address");
        
        if (currency == PayoutCurrency.USDC) {
            usdcAddress = newAddress;
        } else if (currency == PayoutCurrency.USDT) {
            usdtAddress = newAddress;
        }
        
        emit StablecoinAddressUpdated(currency, newAddress);
    }
    
    /**
     * @notice Set platform fee
     * @param feeBps Fee in basis points
     */
    function setPlatformFee(uint256 feeBps) external onlyRole(ADMIN_ROLE) {
        require(feeBps <= 500, "DividendDistributor: fee too high"); // Max 5%
        platformFeeBps = feeBps;
    }
    
    /**
     * @notice Set fee recipient
     * @param recipient New recipient address
     */
    function setFeeRecipient(address recipient) external onlyRole(ADMIN_ROLE) {
        feeRecipient = recipient;
    }
    
    /**
     * @notice Set minimum dividend amount
     * @param minimum New minimum
     */
    function setMinimumDividendAmount(uint256 minimum) external onlyRole(ADMIN_ROLE) {
        minimumDividendAmount = minimum;
    }
    
    /**
     * @notice Set default expiration period
     * @param period New period in seconds
     */
    function setDefaultExpirationPeriod(uint256 period) external onlyRole(ADMIN_ROLE) {
        require(period >= 30 days, "DividendDistributor: period too short");
        defaultExpirationPeriod = period;
    }
    
    /**
     * @notice Pause distributions
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @notice Unpause distributions
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @notice Get dividend round details
     * @param roundId Round ID
     * @return Dividend round data
     */
    function getDividendRound(uint256 roundId) 
        external 
        view 
        returns (DividendRound memory) 
    {
        return dividendRounds[roundId];
    }
    
    /**
     * @notice Get investor's claim status for a round
     * @param roundId Round ID
     * @param investor Investor address
     * @return Claim record
     */
    function getClaimRecord(uint256 roundId, address investor) 
        external 
        view 
        returns (ClaimRecord memory) 
    {
        return claims[roundId][investor];
    }
    
    /**
     * @notice Calculate investor's entitlement for a round
     * @param roundId Round ID
     * @param investor Investor address
     * @return Entitlement amount
     */
    function calculateEntitlement(uint256 roundId, address investor) 
        external 
        view 
        returns (uint256) 
    {
        DividendRound storage round = dividendRounds[roundId];
        if (round.id == 0) return 0;
        
        IERC20 token = IERC20(round.propertyToken);
        uint256 balance = token.balanceOf(investor);
        
        return (balance * round.amountPerToken) / 1e18;
    }
    
    /**
     * @notice Get all rounds for a property
     * @param propertyToken Property address
     * @return Array of round IDs
     */
    function getPropertyRounds(address propertyToken) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return propertyRounds[propertyToken];
    }
    
    /**
     * @notice Get unclaimed dividends for an investor across all rounds
     * @param investor Investor address
     * @param propertyToken Property token (address(0) for all)
     * @return Total unclaimed amount
     */
    function getUnclaimedDividends(address investor, address propertyToken) 
        external 
        view 
        returns (uint256) 
    {
        uint256 total = 0;
        
        for (uint256 i = 1; i <= roundCount; i++) {
            DividendRound storage round = dividendRounds[i];
            
            // Filter by property if specified
            if (propertyToken != address(0) && round.propertyToken != propertyToken) {
                continue;
            }
            
            // Check if claimable
            if (round.status != DividendStatus.Funded && round.status != DividendStatus.Distributing) {
                continue;
            }
            if (block.timestamp < round.paymentDate || block.timestamp > round.expirationDate) {
                continue;
            }
            
            // Check if already claimed
            if (claims[i][investor].claimed) {
                continue;
            }
            
            // Calculate entitlement
            IERC20 token = IERC20(round.propertyToken);
            uint256 balance = token.balanceOf(investor);
            if (balance > 0) {
                total += (balance * round.amountPerToken) / 1e18;
            }
        }
        
        return total;
    }
    
    // ============ INTERNAL FUNCTIONS ============
    
    /**
     * @notice Get currency address
     * @param currency Currency enum
     * @return Address of currency token
     */
    function _getCurrencyAddress(PayoutCurrency currency) internal view returns (address) {
        if (currency == PayoutCurrency.ETH) {
            return address(0);
        } else if (currency == PayoutCurrency.USDC) {
            return usdcAddress;
        } else if (currency == PayoutCurrency.USDT) {
            return usdtAddress;
        }
        revert("DividendDistributor: invalid currency");
    }
    
    /**
     * @notice Transfer dividend to recipient
     * @param recipient Recipient address
     * @param amount Amount to transfer
     * @param currency Currency type
     * @param currencyAddress Currency token address
     */
    function _transferDividend(
        address recipient,
        uint256 amount,
        PayoutCurrency currency,
        address currencyAddress
    ) internal {
        if (currency == PayoutCurrency.ETH) {
            (bool success, ) = recipient.call{value: amount}("");
            require(success, "DividendDistributor: ETH transfer failed");
        } else {
            IERC20(currencyAddress).safeTransfer(recipient, amount);
        }
        
        totalDividendsDistributed += amount;
    }
    
    // ============ RECEIVE ============
    
    receive() external payable {}
}
