// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title FractionalEstate
 * @author Blockchain Course Team - Capstone Project
 * @notice ERC-1155 based real estate tokenization platform enabling fractional property ownership
 * @dev Implements property listing, fractional token purchases, dividend distribution, and governance
 * 
 * Key Features:
 * - Multi-token standard (ERC-1155) for multiple properties
 * - SEC-compliant investor verification integration
 * - Automated dividend distribution
 * - On-chain governance for property decisions
 * - Minimum investment of $100 equivalent
 */
contract FractionalEstate is 
    ERC1155, 
    ERC1155Burnable, 
    ERC1155Supply, 
    AccessControl, 
    ReentrancyGuard, 
    Pausable 
{
    using Counters for Counters.Counter;

    // ============ ROLES ============
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant PROPERTY_MANAGER_ROLE = keccak256("PROPERTY_MANAGER_ROLE");
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE_ROLE");

    // ============ STATE VARIABLES ============
    Counters.Counter private _propertyIdCounter;
    
    // Minimum investment in wei (approximately $100 at deployment)
    uint256 public minimumInvestment;
    
    // Platform fee percentage (basis points, e.g., 250 = 2.5%)
    uint256 public platformFeeBps = 250;
    
    // Treasury address for platform fees
    address public treasury;

    // ============ STRUCTS ============
    struct Property {
        uint256 id;
        string name;
        string location;
        string propertyType;          // "residential", "commercial", "industrial"
        uint256 totalValue;           // Total property value in wei
        uint256 totalShares;          // Total fractional shares available
        uint256 availableShares;      // Shares still available for purchase
        uint256 pricePerShare;        // Price per share in wei
        uint256 annualYieldBps;       // Expected annual yield in basis points
        uint256 listingTimestamp;
        uint256 fundingDeadline;
        bool isActive;
        bool isFunded;
        address propertyManager;
        string metadataURI;           // IPFS URI for extended metadata
    }

    struct Investor {
        address wallet;
        bool isVerified;              // KYC/AML verified
        bool isAccredited;            // Accredited investor status
        uint256 verificationTimestamp;
        uint256 totalInvested;
        uint256[] propertyIds;        // Properties invested in
    }

    struct Dividend {
        uint256 propertyId;
        uint256 totalAmount;
        uint256 amountPerShare;
        uint256 distributionTimestamp;
        uint256 claimDeadline;
        bool isDistributed;
    }

    // ============ MAPPINGS ============
    mapping(uint256 => Property) public properties;
    mapping(address => Investor) public investors;
    mapping(uint256 => Dividend[]) public propertyDividends;
    mapping(uint256 => mapping(address => uint256)) public dividendsClaimed;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    
    // Property ID => Investor Address => Share balance at dividend snapshot
    mapping(uint256 => mapping(address => uint256)) public dividendSnapshots;

    // ============ EVENTS ============
    event PropertyListed(
        uint256 indexed propertyId,
        string name,
        uint256 totalValue,
        uint256 totalShares,
        uint256 pricePerShare,
        address indexed propertyManager
    );
    
    event SharesPurchased(
        uint256 indexed propertyId,
        address indexed investor,
        uint256 shares,
        uint256 totalPaid
    );
    
    event InvestorVerified(
        address indexed investor,
        bool isAccredited,
        uint256 timestamp
    );
    
    event DividendDeclared(
        uint256 indexed propertyId,
        uint256 indexed dividendIndex,
        uint256 totalAmount,
        uint256 amountPerShare
    );
    
    event DividendClaimed(
        uint256 indexed propertyId,
        address indexed investor,
        uint256 amount
    );
    
    event PropertyFunded(
        uint256 indexed propertyId,
        uint256 timestamp
    );
    
    event PropertyDeactivated(
        uint256 indexed propertyId,
        string reason
    );

    // ============ ERRORS ============
    error PropertyNotFound();
    error PropertyNotActive();
    error InsufficientShares();
    error InvestorNotVerified();
    error BelowMinimumInvestment();
    error FundingDeadlinePassed();
    error AlreadyFunded();
    error NoDividendsToClaim();
    error TransferNotAllowed();
    error InvalidAmount();

    // ============ CONSTRUCTOR ============
    constructor(
        string memory uri_,
        address _treasury,
        uint256 _minimumInvestment
    ) ERC1155(uri_) {
        require(_treasury != address(0), "Invalid treasury");
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(PROPERTY_MANAGER_ROLE, msg.sender);
        _grantRole(COMPLIANCE_ROLE, msg.sender);
        
        treasury = _treasury;
        minimumInvestment = _minimumInvestment;
    }

    // ============ PROPERTY MANAGEMENT ============
    
    /**
     * @notice List a new property for fractional investment
     * @param _name Property name
     * @param _location Property location/address
     * @param _propertyType Type of property (residential, commercial, industrial)
     * @param _totalValue Total property value in wei
     * @param _totalShares Total fractional shares to create
     * @param _annualYieldBps Expected annual yield in basis points
     * @param _fundingDays Days until funding deadline
     * @param _metadataURI IPFS URI for extended property metadata
     */
    function listProperty(
        string memory _name,
        string memory _location,
        string memory _propertyType,
        uint256 _totalValue,
        uint256 _totalShares,
        uint256 _annualYieldBps,
        uint256 _fundingDays,
        string memory _metadataURI
    ) external onlyRole(PROPERTY_MANAGER_ROLE) whenNotPaused returns (uint256) {
        require(_totalValue > 0 && _totalShares > 0, "Invalid values");
        require(_fundingDays > 0 && _fundingDays <= 365, "Invalid funding period");
        
        _propertyIdCounter.increment();
        uint256 propertyId = _propertyIdCounter.current();
        
        uint256 pricePerShare = _totalValue / _totalShares;
        require(pricePerShare >= minimumInvestment, "Share price below minimum");
        
        properties[propertyId] = Property({
            id: propertyId,
            name: _name,
            location: _location,
            propertyType: _propertyType,
            totalValue: _totalValue,
            totalShares: _totalShares,
            availableShares: _totalShares,
            pricePerShare: pricePerShare,
            annualYieldBps: _annualYieldBps,
            listingTimestamp: block.timestamp,
            fundingDeadline: block.timestamp + (_fundingDays * 1 days),
            isActive: true,
            isFunded: false,
            propertyManager: msg.sender,
            metadataURI: _metadataURI
        });
        
        emit PropertyListed(
            propertyId,
            _name,
            _totalValue,
            _totalShares,
            pricePerShare,
            msg.sender
        );
        
        return propertyId;
    }

    /**
     * @notice Purchase fractional shares of a property
     * @param _propertyId ID of the property
     * @param _shares Number of shares to purchase
     */
    function purchaseShares(
        uint256 _propertyId,
        uint256 _shares
    ) external payable nonReentrant whenNotPaused {
        Property storage property = properties[_propertyId];
        
        if (property.id == 0) revert PropertyNotFound();
        if (!property.isActive) revert PropertyNotActive();
        if (property.isFunded) revert AlreadyFunded();
        if (block.timestamp > property.fundingDeadline) revert FundingDeadlinePassed();
        if (_shares > property.availableShares) revert InsufficientShares();
        if (!investors[msg.sender].isVerified) revert InvestorNotVerified();
        
        uint256 totalCost = property.pricePerShare * _shares;
        if (totalCost < minimumInvestment) revert BelowMinimumInvestment();
        if (msg.value < totalCost) revert InvalidAmount();
        
        // Calculate platform fee
        uint256 platformFee = (totalCost * platformFeeBps) / 10000;
        uint256 netAmount = totalCost - platformFee;
        
        // Update state
        property.availableShares -= _shares;
        investors[msg.sender].totalInvested += totalCost;
        
        // Track property investment
        bool alreadyInvested = false;
        for (uint256 i = 0; i < investors[msg.sender].propertyIds.length; i++) {
            if (investors[msg.sender].propertyIds[i] == _propertyId) {
                alreadyInvested = true;
                break;
            }
        }
        if (!alreadyInvested) {
            investors[msg.sender].propertyIds.push(_propertyId);
        }
        
        // Mint ERC-1155 tokens
        _mint(msg.sender, _propertyId, _shares, "");
        
        // Transfer fees to treasury
        if (platformFee > 0) {
            (bool feeSuccess, ) = treasury.call{value: platformFee}("");
            require(feeSuccess, "Fee transfer failed");
        }
        
        // Check if property is fully funded
        if (property.availableShares == 0) {
            property.isFunded = true;
            emit PropertyFunded(_propertyId, block.timestamp);
        }
        
        // Refund excess payment
        if (msg.value > totalCost) {
            (bool refundSuccess, ) = msg.sender.call{value: msg.value - totalCost}("");
            require(refundSuccess, "Refund failed");
        }
        
        emit SharesPurchased(_propertyId, msg.sender, _shares, totalCost);
    }

    // ============ INVESTOR MANAGEMENT ============
    
    /**
     * @notice Verify an investor for platform participation (KYC/AML)
     * @param _investor Address of the investor
     * @param _isAccredited Whether investor is accredited
     */
    function verifyInvestor(
        address _investor,
        bool _isAccredited
    ) external onlyRole(COMPLIANCE_ROLE) {
        require(_investor != address(0), "Invalid address");
        
        investors[_investor] = Investor({
            wallet: _investor,
            isVerified: true,
            isAccredited: _isAccredited,
            verificationTimestamp: block.timestamp,
            totalInvested: investors[_investor].totalInvested,
            propertyIds: investors[_investor].propertyIds
        });
        
        emit InvestorVerified(_investor, _isAccredited, block.timestamp);
    }

    /**
     * @notice Revoke investor verification
     * @param _investor Address of the investor
     */
    function revokeVerification(
        address _investor
    ) external onlyRole(COMPLIANCE_ROLE) {
        investors[_investor].isVerified = false;
    }

    // ============ DIVIDEND MANAGEMENT ============
    
    /**
     * @notice Declare a dividend for property shareholders
     * @param _propertyId ID of the property
     * @param _claimDays Days until claim deadline
     */
    function declareDividend(
        uint256 _propertyId,
        uint256 _claimDays
    ) external payable onlyRole(PROPERTY_MANAGER_ROLE) {
        Property storage property = properties[_propertyId];
        
        if (property.id == 0) revert PropertyNotFound();
        if (!property.isFunded) revert PropertyNotActive();
        if (msg.value == 0) revert InvalidAmount();
        
        uint256 soldShares = property.totalShares - property.availableShares;
        require(soldShares > 0, "No shares sold");
        
        uint256 amountPerShare = msg.value / soldShares;
        
        Dividend memory newDividend = Dividend({
            propertyId: _propertyId,
            totalAmount: msg.value,
            amountPerShare: amountPerShare,
            distributionTimestamp: block.timestamp,
            claimDeadline: block.timestamp + (_claimDays * 1 days),
            isDistributed: true
        });
        
        propertyDividends[_propertyId].push(newDividend);
        
        emit DividendDeclared(
            _propertyId,
            propertyDividends[_propertyId].length - 1,
            msg.value,
            amountPerShare
        );
    }

    /**
     * @notice Claim available dividends for a property
     * @param _propertyId ID of the property
     */
    function claimDividends(uint256 _propertyId) external nonReentrant {
        uint256 shares = balanceOf(msg.sender, _propertyId);
        if (shares == 0) revert NoDividendsToClaim();
        
        Dividend[] storage dividends = propertyDividends[_propertyId];
        uint256 totalClaim = 0;
        
        for (uint256 i = dividendsClaimed[_propertyId][msg.sender]; i < dividends.length; i++) {
            if (block.timestamp <= dividends[i].claimDeadline) {
                totalClaim += dividends[i].amountPerShare * shares;
            }
        }
        
        if (totalClaim == 0) revert NoDividendsToClaim();
        
        dividendsClaimed[_propertyId][msg.sender] = dividends.length;
        
        (bool success, ) = msg.sender.call{value: totalClaim}("");
        require(success, "Dividend transfer failed");
        
        emit DividendClaimed(_propertyId, msg.sender, totalClaim);
    }

    /**
     * @notice Get claimable dividend amount for an investor
     * @param _propertyId ID of the property
     * @param _investor Address of the investor
     */
    function getClaimableDividends(
        uint256 _propertyId,
        address _investor
    ) external view returns (uint256) {
        uint256 shares = balanceOf(_investor, _propertyId);
        if (shares == 0) return 0;
        
        Dividend[] storage dividends = propertyDividends[_propertyId];
        uint256 totalClaimable = 0;
        
        for (uint256 i = dividendsClaimed[_propertyId][_investor]; i < dividends.length; i++) {
            if (block.timestamp <= dividends[i].claimDeadline) {
                totalClaimable += dividends[i].amountPerShare * shares;
            }
        }
        
        return totalClaimable;
    }

    // ============ VIEW FUNCTIONS ============
    
    /**
     * @notice Get property details
     * @param _propertyId ID of the property
     */
    function getProperty(uint256 _propertyId) external view returns (Property memory) {
        return properties[_propertyId];
    }

    /**
     * @notice Get investor details
     * @param _investor Address of the investor
     */
    function getInvestor(address _investor) external view returns (Investor memory) {
        return investors[_investor];
    }

    /**
     * @notice Get total number of properties listed
     */
    function getTotalProperties() external view returns (uint256) {
        return _propertyIdCounter.current();
    }

    /**
     * @notice Get investor's share balance for a property
     * @param _investor Address of the investor
     * @param _propertyId ID of the property
     */
    function getShareBalance(
        address _investor,
        uint256 _propertyId
    ) external view returns (uint256) {
        return balanceOf(_investor, _propertyId);
    }

    /**
     * @notice Get all property IDs an investor has invested in
     * @param _investor Address of the investor
     */
    function getInvestorProperties(
        address _investor
    ) external view returns (uint256[] memory) {
        return investors[_investor].propertyIds;
    }

    /**
     * @notice Get dividend history for a property
     * @param _propertyId ID of the property
     */
    function getDividendHistory(
        uint256 _propertyId
    ) external view returns (Dividend[] memory) {
        return propertyDividends[_propertyId];
    }

    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @notice Deactivate a property
     * @param _propertyId ID of the property
     * @param _reason Reason for deactivation
     */
    function deactivateProperty(
        uint256 _propertyId,
        string memory _reason
    ) external onlyRole(ADMIN_ROLE) {
        properties[_propertyId].isActive = false;
        emit PropertyDeactivated(_propertyId, _reason);
    }

    /**
     * @notice Update platform fee
     * @param _newFeeBps New fee in basis points
     */
    function updatePlatformFee(uint256 _newFeeBps) external onlyRole(ADMIN_ROLE) {
        require(_newFeeBps <= 1000, "Fee too high"); // Max 10%
        platformFeeBps = _newFeeBps;
    }

    /**
     * @notice Update treasury address
     * @param _newTreasury New treasury address
     */
    function updateTreasury(address _newTreasury) external onlyRole(ADMIN_ROLE) {
        require(_newTreasury != address(0), "Invalid address");
        treasury = _newTreasury;
    }

    /**
     * @notice Update minimum investment amount
     * @param _newMinimum New minimum in wei
     */
    function updateMinimumInvestment(uint256 _newMinimum) external onlyRole(ADMIN_ROLE) {
        minimumInvestment = _newMinimum;
    }

    /**
     * @notice Pause contract operations
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause contract operations
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @notice Set URI for token metadata
     * @param newuri New URI
     */
    function setURI(string memory newuri) external onlyRole(ADMIN_ROLE) {
        _setURI(newuri);
    }

    // ============ OVERRIDE FUNCTIONS ============
    
    /**
     * @dev Override to add transfer restrictions for non-verified investors
     */
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override(ERC1155, ERC1155Supply) whenNotPaused {
        // Allow minting (from == address(0))
        if (from != address(0) && to != address(0)) {
            // Verify recipient for transfers
            if (!investors[to].isVerified) revert TransferNotAllowed();
        }
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

    /**
     * @dev Override required by Solidity for multiple inheritance
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
