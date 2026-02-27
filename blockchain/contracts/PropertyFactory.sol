// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./PropertyToken.sol";

/**
 * @title PropertyFactory
 * @notice Factory contract for deploying new PropertyToken contracts
 * @dev Central hub for property registration and management
 * 
 * Key Features:
 * - Deploy new property tokens with one transaction
 * - Central registry of all properties
 * - Integration with InvestorRegistry, DividendDistributor, and Governance
 * - Property lifecycle management
 */
contract PropertyFactory is AccessControl, Pausable {
    
    // ============ ROLES ============
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant DEPLOYER_ROLE = keccak256("DEPLOYER_ROLE");
    
    // ============ ENUMS ============
    
    /// @notice Property status
    enum PropertyStatus {
        Draft,          // Property created but not active
        Offering,       // Token sale in progress
        Active,         // Fully funded and operational
        Suspended,      // Temporarily suspended
        Liquidating,    // In process of selling
        Closed          // Property sold, tokens redeemed
    }
    
    // ============ STRUCTS ============
    
    /// @notice Property registration data
    struct PropertyRecord {
        uint256 id;
        address tokenAddress;
        string propertyId;
        string name;
        string symbol;
        string metadataURI;
        PropertyStatus status;
        uint256 totalSupply;
        uint256 valuation;
        uint256 createdAt;
        uint256 fundedAt;
        address deployer;
    }
    
    // ============ STATE VARIABLES ============
    
    /// @notice Property counter
    uint256 public propertyCount;
    
    /// @notice Investor registry address
    address public investorRegistry;
    
    /// @notice Dividend distributor address
    address public dividendDistributor;
    
    /// @notice Governance contract address
    address public governance;
    
    /// @notice Minimum property valuation
    uint256 public minimumValuation = 100000 * 1e6; // $100,000
    
    /// @notice Maximum property valuation
    uint256 public maximumValuation = 100000000 * 1e6; // $100,000,000
    
    // ============ MAPPINGS ============
    
    /// @notice Property ID => property record
    mapping(uint256 => PropertyRecord) public properties;
    
    /// @notice Token address => property ID
    mapping(address => uint256) public tokenToPropertyId;
    
    /// @notice Property string ID => property ID
    mapping(string => uint256) public propertyIdToId;
    
    /// @notice Token address => is registered property
    mapping(address => bool) public isRegisteredProperty;
    
    // ============ EVENTS ============
    
    event PropertyCreated(
        uint256 indexed id,
        address indexed tokenAddress,
        string propertyId,
        string name,
        uint256 valuation,
        address deployer
    );
    
    event PropertyStatusChanged(
        uint256 indexed id,
        PropertyStatus oldStatus,
        PropertyStatus newStatus
    );
    
    event RegistryUpdated(string registryType, address newAddress);
    
    // ============ CONSTRUCTOR ============
    
    constructor(address _admin) {
        require(_admin != address(0), "PropertyFactory: invalid admin");
        
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
        _grantRole(DEPLOYER_ROLE, _admin);
    }
    
    // ============ PROPERTY DEPLOYMENT ============
    
    /**
     * @notice Deploy a new property token
     * @param _name Token name
     * @param _symbol Token symbol
     * @param _propertyId Unique property identifier
     * @param _metadataURI IPFS hash for property metadata
     * @param _totalSupply Total token supply
     * @param _valuation Property valuation in USD (6 decimals)
     * @param _minimumInvestment Minimum tokens per investment
     * @return tokenAddress Address of deployed token
     */
    function createProperty(
        string calldata _name,
        string calldata _symbol,
        string calldata _propertyId,
        string calldata _metadataURI,
        uint256 _totalSupply,
        uint256 _valuation,
        uint256 _minimumInvestment
    ) external onlyRole(DEPLOYER_ROLE) whenNotPaused returns (address tokenAddress) {
        require(bytes(_propertyId).length > 0, "PropertyFactory: empty property ID");
        require(propertyIdToId[_propertyId] == 0, "PropertyFactory: property ID exists");
        require(_valuation >= minimumValuation, "PropertyFactory: below minimum valuation");
        require(_valuation <= maximumValuation, "PropertyFactory: above maximum valuation");
        require(_totalSupply > 0, "PropertyFactory: invalid supply");
        
        // Deploy new PropertyToken
        PropertyToken token = new PropertyToken(
            _name,
            _symbol,
            _propertyId,
            _metadataURI,
            _totalSupply,
            _valuation,
            _minimumInvestment,
            msg.sender
        );
        
        tokenAddress = address(token);
        
        // Register property
        propertyCount++;
        uint256 propertyId = propertyCount;
        
        properties[propertyId] = PropertyRecord({
            id: propertyId,
            tokenAddress: tokenAddress,
            propertyId: _propertyId,
            name: _name,
            symbol: _symbol,
            metadataURI: _metadataURI,
            status: PropertyStatus.Draft,
            totalSupply: _totalSupply,
            valuation: _valuation,
            createdAt: block.timestamp,
            fundedAt: 0,
            deployer: msg.sender
        });
        
        tokenToPropertyId[tokenAddress] = propertyId;
        propertyIdToId[_propertyId] = propertyId;
        isRegisteredProperty[tokenAddress] = true;
        
        // Set up integrations if configured
        if (investorRegistry != address(0)) {
            token.setInvestorRegistry(investorRegistry);
        }
        if (dividendDistributor != address(0)) {
            token.setDividendDistributor(dividendDistributor);
        }
        
        emit PropertyCreated(
            propertyId,
            tokenAddress,
            _propertyId,
            _name,
            _valuation,
            msg.sender
        );
        
        return tokenAddress;
    }
    
    // ============ PROPERTY LIFECYCLE ============
    
    /**
     * @notice Update property status
     * @param propertyId Property ID
     * @param newStatus New status
     */
    function updatePropertyStatus(uint256 propertyId, PropertyStatus newStatus) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        require(propertyId > 0 && propertyId <= propertyCount, "PropertyFactory: invalid ID");
        
        PropertyRecord storage property = properties[propertyId];
        PropertyStatus oldStatus = property.status;
        
        // Validate status transitions
        if (newStatus == PropertyStatus.Offering) {
            require(oldStatus == PropertyStatus.Draft, "PropertyFactory: invalid transition");
        } else if (newStatus == PropertyStatus.Active) {
            require(
                oldStatus == PropertyStatus.Offering || oldStatus == PropertyStatus.Suspended,
                "PropertyFactory: invalid transition"
            );
            if (property.fundedAt == 0) {
                property.fundedAt = block.timestamp;
            }
        } else if (newStatus == PropertyStatus.Liquidating) {
            require(oldStatus == PropertyStatus.Active, "PropertyFactory: invalid transition");
        }
        
        property.status = newStatus;
        
        emit PropertyStatusChanged(propertyId, oldStatus, newStatus);
    }
    
    /**
     * @notice Start token offering for a property
     * @param propertyId Property ID
     * @param startTime Offering start time
     * @param endTime Offering end time (0 for no end)
     */
    function startOffering(
        uint256 propertyId,
        uint256 startTime,
        uint256 endTime
    ) external onlyRole(ADMIN_ROLE) {
        require(propertyId > 0 && propertyId <= propertyCount, "PropertyFactory: invalid ID");
        
        PropertyRecord storage property = properties[propertyId];
        require(property.status == PropertyStatus.Draft, "PropertyFactory: not in draft");
        
        PropertyToken token = PropertyToken(property.tokenAddress);
        token.startOffering(startTime, endTime);
        
        property.status = PropertyStatus.Offering;
        
        emit PropertyStatusChanged(propertyId, PropertyStatus.Draft, PropertyStatus.Offering);
    }
    
    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @notice Set investor registry address
     * @param _registry Registry address
     */
    function setInvestorRegistry(address _registry) external onlyRole(ADMIN_ROLE) {
        investorRegistry = _registry;
        emit RegistryUpdated("InvestorRegistry", _registry);
    }
    
    /**
     * @notice Set dividend distributor address
     * @param _distributor Distributor address
     */
    function setDividendDistributor(address _distributor) external onlyRole(ADMIN_ROLE) {
        dividendDistributor = _distributor;
        emit RegistryUpdated("DividendDistributor", _distributor);
    }
    
    /**
     * @notice Set governance contract address
     * @param _governance Governance address
     */
    function setGovernance(address _governance) external onlyRole(ADMIN_ROLE) {
        governance = _governance;
        emit RegistryUpdated("Governance", _governance);
    }
    
    /**
     * @notice Update valuation limits
     * @param _min Minimum valuation
     * @param _max Maximum valuation
     */
    function setValuationLimits(uint256 _min, uint256 _max) external onlyRole(ADMIN_ROLE) {
        require(_max > _min, "PropertyFactory: invalid limits");
        minimumValuation = _min;
        maximumValuation = _max;
    }
    
    /**
     * @notice Pause factory
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @notice Unpause factory
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @notice Get property record by ID
     * @param propertyId Property ID
     * @return Property record
     */
    function getProperty(uint256 propertyId) 
        external 
        view 
        returns (PropertyRecord memory) 
    {
        return properties[propertyId];
    }
    
    /**
     * @notice Get property record by token address
     * @param tokenAddress Token address
     * @return Property record
     */
    function getPropertyByToken(address tokenAddress) 
        external 
        view 
        returns (PropertyRecord memory) 
    {
        uint256 propertyId = tokenToPropertyId[tokenAddress];
        return properties[propertyId];
    }
    
    /**
     * @notice Get property record by string ID
     * @param propertyStringId Property string identifier
     * @return Property record
     */
    function getPropertyByStringId(string calldata propertyStringId) 
        external 
        view 
        returns (PropertyRecord memory) 
    {
        uint256 propertyId = propertyIdToId[propertyStringId];
        return properties[propertyId];
    }
    
    /**
     * @notice Get all property IDs
     * @return Array of property IDs
     */
    function getAllPropertyIds() external view returns (uint256[] memory) {
        uint256[] memory ids = new uint256[](propertyCount);
        for (uint256 i = 1; i <= propertyCount; i++) {
            ids[i - 1] = i;
        }
        return ids;
    }
    
    /**
     * @notice Get properties by status
     * @param status Property status to filter
     * @return Array of property records
     */
    function getPropertiesByStatus(PropertyStatus status) 
        external 
        view 
        returns (PropertyRecord[] memory) 
    {
        // First count matching properties
        uint256 count = 0;
        for (uint256 i = 1; i <= propertyCount; i++) {
            if (properties[i].status == status) {
                count++;
            }
        }
        
        // Then populate array
        PropertyRecord[] memory result = new PropertyRecord[](count);
        uint256 index = 0;
        for (uint256 i = 1; i <= propertyCount; i++) {
            if (properties[i].status == status) {
                result[index] = properties[i];
                index++;
            }
        }
        
        return result;
    }
    
    /**
     * @notice Get total valuation of all active properties
     * @return Total valuation in USD
     */
    function getTotalValuation() external view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 1; i <= propertyCount; i++) {
            if (properties[i].status == PropertyStatus.Active) {
                total += properties[i].valuation;
            }
        }
        return total;
    }
    
    /**
     * @notice Check if property token is registered
     * @param tokenAddress Address to check
     * @return Boolean
     */
    function isProperty(address tokenAddress) external view returns (bool) {
        return isRegisteredProperty[tokenAddress];
    }
}
