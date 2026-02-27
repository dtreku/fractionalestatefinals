// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title PropertyToken
 * @notice ERC-20 token representing fractional ownership in a real estate property
 * @dev Each property has its own PropertyToken contract with compliance features
 * 
 * Key Features:
 * - Fractional ownership starting at $100 minimum investment
 * - SEC-compliant investor verification requirement
 * - Transfer restrictions for compliance
 * - Dividend distribution capability
 * - On-chain governance voting rights
 */
contract PropertyToken is ERC20, ERC20Burnable, AccessControl, Pausable, ReentrancyGuard {
    
    // ============ ROLES ============
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE_ROLE");
    bytes32 public constant DIVIDEND_ROLE = keccak256("DIVIDEND_ROLE");
    
    // ============ STATE VARIABLES ============
    
    /// @notice Property unique identifier
    string public propertyId;
    
    /// @notice IPFS hash containing property metadata
    string public metadataURI;
    
    /// @notice Total property valuation in USD (6 decimals)
    uint256 public propertyValuation;
    
    /// @notice Price per token in USD (6 decimals)
    uint256 public tokenPriceUSD;
    
    /// @notice Minimum investment amount in tokens
    uint256 public minimumInvestment;
    
    /// @notice Maximum tokens per investor (0 = no limit)
    uint256 public maxTokensPerInvestor;
    
    /// @notice Reference to InvestorRegistry for compliance checks
    address public investorRegistry;
    
    /// @notice Reference to DividendDistributor contract
    address public dividendDistributor;
    
    /// @notice Whether the property is currently accepting investments
    bool public isOfferingActive;
    
    /// @notice Timestamp when the offering started
    uint256 public offeringStartTime;
    
    /// @notice Timestamp when the offering ends (0 = no end date)
    uint256 public offeringEndTime;
    
    /// @notice Total dividends distributed (for tracking)
    uint256 public totalDividendsDistributed;
    
    // ============ MAPPINGS ============
    
    /// @notice Tracks verified investors who can hold tokens
    mapping(address => bool) public verifiedInvestors;
    
    /// @notice Tracks frozen accounts (compliance holds)
    mapping(address => bool) public frozenAccounts;
    
    /// @notice Tracks dividend claims per investor
    mapping(address => uint256) public lastDividendClaimed;
    
    // ============ EVENTS ============
    
    event InvestorVerified(address indexed investor, uint256 timestamp);
    event InvestorRevoked(address indexed investor, string reason);
    event AccountFrozen(address indexed account, string reason);
    event AccountUnfrozen(address indexed account);
    event TokensPurchased(address indexed investor, uint256 amount, uint256 totalPaid);
    event OfferingStatusChanged(bool isActive);
    event PropertyValuationUpdated(uint256 oldValue, uint256 newValue);
    event MetadataUpdated(string oldURI, string newURI);
    event DividendDistributorUpdated(address oldAddress, address newAddress);
    event MinimumInvestmentUpdated(uint256 oldAmount, uint256 newAmount);
    
    // ============ MODIFIERS ============
    
    modifier onlyVerifiedInvestor(address account) {
        require(verifiedInvestors[account], "PropertyToken: investor not verified");
        _;
    }
    
    modifier notFrozen(address account) {
        require(!frozenAccounts[account], "PropertyToken: account is frozen");
        _;
    }
    
    modifier offeringActive() {
        require(isOfferingActive, "PropertyToken: offering not active");
        require(block.timestamp >= offeringStartTime, "PropertyToken: offering not started");
        if (offeringEndTime > 0) {
            require(block.timestamp <= offeringEndTime, "PropertyToken: offering ended");
        }
        _;
    }
    
    // ============ CONSTRUCTOR ============
    
    /**
     * @notice Initialize the property token
     * @param _name Token name (e.g., "123 Main St Shares")
     * @param _symbol Token symbol (e.g., "123MAIN")
     * @param _propertyId Unique property identifier
     * @param _metadataURI IPFS hash for property metadata
     * @param _totalSupply Total tokens representing 100% ownership
     * @param _propertyValuation Total property value in USD (6 decimals)
     * @param _minimumInvestment Minimum tokens per purchase
     * @param _admin Admin address
     */
    constructor(
    string memory _name,
    string memory _symbol,
    string memory _propertyId,
    string memory _metadataURI,
    uint256 _totalSupply,
    uint256 _propertyValuation,
    uint256 _minimumInvestment,
    address _admin
    ) ERC20(_name, _symbol) {
        require(_totalSupply > 0, "PropertyToken: supply must be > 0");
        require(_propertyValuation > 0, "PropertyToken: valuation must be > 0");
        require(_admin != address(0), "PropertyToken: invalid admin");
        
        propertyId = _propertyId;
        metadataURI = _metadataURI;
        propertyValuation = _propertyValuation;
        tokenPriceUSD = _propertyValuation / _totalSupply;
        minimumInvestment = _minimumInvestment;
        
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
        _grantRole(COMPLIANCE_ROLE, _admin);
        _grantRole(DIVIDEND_ROLE, _admin);
        
        // ✅ ADD THIS LINE: Grant ADMIN_ROLE to deployer (factory) for integration setup
        if (msg.sender != _admin) {
            _grantRole(ADMIN_ROLE, msg.sender);
        }
        
        // Mint all tokens to admin initially (for distribution during offering)
        _mint(_admin, _totalSupply);
        
        // Auto-verify admin
        verifiedInvestors[_admin] = true;
    }
    
    // ============ COMPLIANCE FUNCTIONS ============
    
    /**
     * @notice Verify an investor for token ownership
     * @param investor Address to verify
     */
    function verifyInvestor(address investor) 
        external 
        onlyRole(COMPLIANCE_ROLE) 
    {
        require(investor != address(0), "PropertyToken: invalid address");
        verifiedInvestors[investor] = true;
        emit InvestorVerified(investor, block.timestamp);
    }
    
    /**
     * @notice Batch verify multiple investors
     * @param investors Array of addresses to verify
     */
    function batchVerifyInvestors(address[] calldata investors) 
        external 
        onlyRole(COMPLIANCE_ROLE) 
    {
        for (uint256 i = 0; i < investors.length; i++) {
            if (investors[i] != address(0)) {
                verifiedInvestors[investors[i]] = true;
                emit InvestorVerified(investors[i], block.timestamp);
            }
        }
    }
    
    /**
     * @notice Revoke investor verification
     * @param investor Address to revoke
     * @param reason Reason for revocation
     */
    function revokeInvestor(address investor, string calldata reason) 
        external 
        onlyRole(COMPLIANCE_ROLE) 
    {
        verifiedInvestors[investor] = false;
        emit InvestorRevoked(investor, reason);
    }
    
    /**
     * @notice Freeze an account (compliance hold)
     * @param account Address to freeze
     * @param reason Reason for freeze
     */
    function freezeAccount(address account, string calldata reason) 
        external 
        onlyRole(COMPLIANCE_ROLE) 
    {
        frozenAccounts[account] = true;
        emit AccountFrozen(account, reason);
    }
    
    /**
     * @notice Unfreeze an account
     * @param account Address to unfreeze
     */
    function unfreezeAccount(address account) 
        external 
        onlyRole(COMPLIANCE_ROLE) 
    {
        frozenAccounts[account] = false;
        emit AccountUnfrozen(account);
    }
    
    // ============ OFFERING FUNCTIONS ============
    
    /**
     * @notice Start the token offering
     * @param _startTime Timestamp when offering starts
     * @param _endTime Timestamp when offering ends (0 for no end)
     */
    function startOffering(uint256 _startTime, uint256 _endTime) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        require(!isOfferingActive, "PropertyToken: offering already active");
        require(_startTime >= block.timestamp, "PropertyToken: start must be future");
        if (_endTime > 0) {
            require(_endTime > _startTime, "PropertyToken: end must be after start");
        }
        
        isOfferingActive = true;
        offeringStartTime = _startTime;
        offeringEndTime = _endTime;
        
        emit OfferingStatusChanged(true);
    }
    
    /**
     * @notice End the token offering
     */
    function endOffering() 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        isOfferingActive = false;
        emit OfferingStatusChanged(false);
    }
    
    /**
     * @notice Purchase tokens during offering (admin distributes)
     * @param investor Verified investor address
     * @param amount Number of tokens to transfer
     */
    function distributeTokens(address investor, uint256 amount) 
        external 
        onlyRole(ADMIN_ROLE)
        offeringActive
        onlyVerifiedInvestor(investor)
        notFrozen(investor)
        nonReentrant
    {
        require(amount >= minimumInvestment, "PropertyToken: below minimum investment");
        
        if (maxTokensPerInvestor > 0) {
            require(
                balanceOf(investor) + amount <= maxTokensPerInvestor,
                "PropertyToken: exceeds max per investor"
            );
        }
        
        _transfer(msg.sender, investor, amount);
        
        emit TokensPurchased(investor, amount, amount * tokenPriceUSD);
    }
    
    // ============ TRANSFER OVERRIDES ============
    
    /**
     * @notice Override transfer to enforce compliance
     */
    function transfer(address to, uint256 amount) 
        public 
        override 
        whenNotPaused
        notFrozen(msg.sender)
        notFrozen(to)
        returns (bool) 
    {
        // Recipient must be verified for secondary transfers
        require(
            verifiedInvestors[to] || hasRole(ADMIN_ROLE, msg.sender),
            "PropertyToken: recipient not verified"
        );
        return super.transfer(to, amount);
    }
    
    /**
     * @notice Override transferFrom to enforce compliance
     */
    function transferFrom(address from, address to, uint256 amount) 
        public 
        override 
        whenNotPaused
        notFrozen(from)
        notFrozen(to)
        returns (bool) 
    {
        require(
            verifiedInvestors[to] || hasRole(ADMIN_ROLE, msg.sender),
            "PropertyToken: recipient not verified"
        );
        return super.transferFrom(from, to, amount);
    }
    
    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @notice Update property valuation
     * @param newValuation New valuation in USD (6 decimals)
     */
    function updateValuation(uint256 newValuation) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        require(newValuation > 0, "PropertyToken: valuation must be > 0");
        uint256 oldValuation = propertyValuation;
        propertyValuation = newValuation;
        tokenPriceUSD = newValuation / totalSupply();
        emit PropertyValuationUpdated(oldValuation, newValuation);
    }
    
    /**
     * @notice Update metadata URI
     * @param newURI New IPFS hash
     */
    function updateMetadata(string calldata newURI) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        string memory oldURI = metadataURI;
        metadataURI = newURI;
        emit MetadataUpdated(oldURI, newURI);
    }
    
    /**
     * @notice Set dividend distributor contract
     * @param _distributor Dividend distributor address
     */
    function setDividendDistributor(address _distributor) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        address oldDistributor = dividendDistributor;
        dividendDistributor = _distributor;
        emit DividendDistributorUpdated(oldDistributor, _distributor);
    }
    
    /**
     * @notice Set investor registry contract
     * @param _registry Investor registry address
     */
    function setInvestorRegistry(address _registry) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        investorRegistry = _registry;
    }
    
    /**
     * @notice Update minimum investment
     * @param _minimum New minimum in tokens
     */
    function setMinimumInvestment(uint256 _minimum) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        uint256 oldMinimum = minimumInvestment;
        minimumInvestment = _minimum;
        emit MinimumInvestmentUpdated(oldMinimum, _minimum);
    }
    
    /**
     * @notice Set maximum tokens per investor
     * @param _max Maximum tokens (0 = no limit)
     */
    function setMaxTokensPerInvestor(uint256 _max) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        maxTokensPerInvestor = _max;
    }
    
    /**
     * @notice Pause all transfers (emergency)
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @notice Unpause transfers
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @notice Get investor's ownership percentage
     * @param investor Address to check
     * @return Percentage with 4 decimals (e.g., 1000 = 0.1%)
     */
    function getOwnershipPercentage(address investor) 
        external 
        view 
        returns (uint256) 
    {
        if (totalSupply() == 0) return 0;
        return (balanceOf(investor) * 1000000) / totalSupply();
    }
    
    /**
     * @notice Get investor's holdings value in USD
     * @param investor Address to check
     * @return Value in USD (6 decimals)
     */
    function getHoldingsValueUSD(address investor) 
        external 
        view 
        returns (uint256) 
    {
        return balanceOf(investor) * tokenPriceUSD;
    }
    
    /**
     * @notice Check if an address can receive tokens
     * @param account Address to check
     * @return Boolean indicating eligibility
     */
    function canReceiveTokens(address account) 
        external 
        view 
        returns (bool) 
    {
        return verifiedInvestors[account] && !frozenAccounts[account];
    }
    
    /**
     * @notice Get property details
     * @return Property ID, metadata URI, valuation, token price
     */
    function getPropertyDetails() 
        external 
        view 
        returns (
            string memory,
            string memory,
            uint256,
            uint256,
            uint256,
            bool
        ) 
    {
        return (
            propertyId,
            metadataURI,
            propertyValuation,
            tokenPriceUSD,
            totalSupply(),
            isOfferingActive
        );
    }
    
    /**
     * @notice Token decimals (standard 18)
     */
    function decimals() public pure override returns (uint8) {
        return 18;
    }
}
