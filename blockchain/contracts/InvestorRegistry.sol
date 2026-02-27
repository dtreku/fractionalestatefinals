// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title InvestorRegistry
 * @notice Central registry for investor verification and compliance
 * @dev Manages KYC/AML verification status across all property tokens
 * 
 * Key Features:
 * - Centralized investor verification (verify once, invest everywhere)
 * - Accreditation status tracking (SEC Reg D compliance)
 * - Geographic restrictions for legal compliance
 * - Verification expiry and renewal
 * - Audit trail for compliance reporting
 */
contract InvestorRegistry is AccessControl, Pausable {
    
    // ============ ROLES ============
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE_ROLE");
    
    // ============ ENUMS ============
    
    /// @notice Investor verification status
    enum VerificationStatus {
        None,           // Not registered
        Pending,        // Application submitted
        Verified,       // KYC approved
        Accredited,     // Accredited investor verified
        Rejected,       // Application rejected
        Expired,        // Verification expired
        Suspended       // Temporarily suspended
    }
    
    /// @notice Accreditation type per SEC rules
    enum AccreditationType {
        None,
        IncomeThreshold,      // $200K+ income (or $300K joint)
        NetWorthThreshold,    // $1M+ net worth excluding primary residence
        ProfessionalCert,     // Series 7, 65, or 82 license
        EntityQualified,      // Qualified institutional buyer
        Other                 // Other qualification
    }
    
    // ============ STRUCTS ============
    
    /// @notice Investor profile data
    struct InvestorProfile {
        VerificationStatus status;
        AccreditationType accreditationType;
        string countryCode;          // ISO 3166-1 alpha-2 (e.g., "US")
        string stateCode;            // For US investors (e.g., "CA")
        uint256 verificationDate;    // When verified
        uint256 expirationDate;      // When verification expires
        uint256 totalInvested;       // Total USD invested across properties
        uint256 propertyCount;       // Number of properties invested in
        string kycDocumentHash;      // IPFS hash of KYC documents
        bool isRestricted;           // Manual restriction flag
        string restrictionReason;    // Reason if restricted
    }
    
    /// @notice Verification request record
    struct VerificationRequest {
        address investor;
        uint256 requestDate;
        string documentHash;
        bool processed;
        bool approved;
        string processorNotes;
    }
    
    // ============ STATE VARIABLES ============
    
    /// @notice Verification validity period (default 1 year)
    uint256 public verificationValidityPeriod = 365 days;
    
    /// @notice Minimum investment threshold for accreditation requirement
    uint256 public accreditationThreshold = 0; // 0 = no accreditation required
    
    /// @notice Total registered investors
    uint256 public totalInvestors;
    
    /// @notice Total verified investors
    uint256 public verifiedInvestorCount;
    
    /// @notice Total accredited investors
    uint256 public accreditedInvestorCount;
    
    // ============ MAPPINGS ============
    
    /// @notice Investor address => profile
    mapping(address => InvestorProfile) public investors;
    
    /// @notice Country code => is restricted
    mapping(string => bool) public restrictedCountries;
    
    /// @notice State code => is restricted (for US)
    mapping(string => bool) public restrictedStates;
    
    /// @notice Property token address => is registered
    mapping(address => bool) public registeredProperties;
    
    /// @notice Investor => property => invested amount
    mapping(address => mapping(address => uint256)) public investorPropertyHoldings;
    
    /// @notice Verification request ID => request data
    mapping(uint256 => VerificationRequest) public verificationRequests;
    uint256 public requestCount;
    
    // ============ EVENTS ============
    
    event InvestorRegistered(address indexed investor, uint256 timestamp);
    event InvestorVerified(
        address indexed investor, 
        VerificationStatus status,
        AccreditationType accreditationType,
        uint256 expirationDate
    );
    event InvestorStatusChanged(
        address indexed investor,
        VerificationStatus oldStatus,
        VerificationStatus newStatus,
        string reason
    );
    event VerificationRequested(
        uint256 indexed requestId,
        address indexed investor,
        string documentHash
    );
    event VerificationProcessed(
        uint256 indexed requestId,
        address indexed investor,
        bool approved,
        string notes
    );
    event InvestmentRecorded(
        address indexed investor,
        address indexed property,
        uint256 amount
    );
    event CountryRestrictionUpdated(string countryCode, bool restricted);
    event StateRestrictionUpdated(string stateCode, bool restricted);
    event PropertyRegistered(address indexed propertyToken);
    event InvestorRestricted(address indexed investor, string reason);
    event InvestorUnrestricted(address indexed investor);
    
    // ============ CONSTRUCTOR ============
    
    constructor(address _admin) {
        require(_admin != address(0), "InvestorRegistry: invalid admin");
        
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
        _grantRole(VERIFIER_ROLE, _admin);
        _grantRole(COMPLIANCE_ROLE, _admin);
        
        // Default restricted countries (OFAC sanctioned)
        restrictedCountries["CU"] = true; // Cuba
        restrictedCountries["IR"] = true; // Iran
        restrictedCountries["KP"] = true; // North Korea
        restrictedCountries["SY"] = true; // Syria
        restrictedCountries["RU"] = true; // Russia (certain restrictions)
    }
    
    // ============ INVESTOR REGISTRATION ============
    
    /**
     * @notice Register a new investor (self-registration)
     * @param countryCode ISO 3166-1 alpha-2 country code
     * @param stateCode State/province code (required for US)
     */
    function registerInvestor(
        string calldata countryCode,
        string calldata stateCode
    ) external whenNotPaused {
        require(
            investors[msg.sender].status == VerificationStatus.None,
            "InvestorRegistry: already registered"
        );
        require(
            !restrictedCountries[countryCode],
            "InvestorRegistry: country restricted"
        );
        
        // Check US state restrictions
        if (keccak256(bytes(countryCode)) == keccak256(bytes("US"))) {
            require(
                !restrictedStates[stateCode],
                "InvestorRegistry: state restricted"
            );
        }
        
        investors[msg.sender] = InvestorProfile({
            status: VerificationStatus.Pending,
            accreditationType: AccreditationType.None,
            countryCode: countryCode,
            stateCode: stateCode,
            verificationDate: 0,
            expirationDate: 0,
            totalInvested: 0,
            propertyCount: 0,
            kycDocumentHash: "",
            isRestricted: false,
            restrictionReason: ""
        });
        
        totalInvestors++;
        emit InvestorRegistered(msg.sender, block.timestamp);
    }
    
    /**
     * @notice Submit verification request with KYC documents
     * @param documentHash IPFS hash of KYC documents
     */
    function submitVerificationRequest(string calldata documentHash) 
        external 
        whenNotPaused 
    {
        require(
            investors[msg.sender].status == VerificationStatus.Pending ||
            investors[msg.sender].status == VerificationStatus.Expired ||
            investors[msg.sender].status == VerificationStatus.Rejected,
            "InvestorRegistry: cannot submit request"
        );
        
        requestCount++;
        verificationRequests[requestCount] = VerificationRequest({
            investor: msg.sender,
            requestDate: block.timestamp,
            documentHash: documentHash,
            processed: false,
            approved: false,
            processorNotes: ""
        });
        
        investors[msg.sender].kycDocumentHash = documentHash;
        
        emit VerificationRequested(requestCount, msg.sender, documentHash);
    }
    
    // ============ VERIFIER FUNCTIONS ============
    
    /**
     * @notice Process a verification request
     * @param requestId Request ID to process
     * @param approved Whether to approve
     * @param accreditationType Type of accreditation (if applicable)
     * @param notes Processing notes
     */
    function processVerificationRequest(
        uint256 requestId,
        bool approved,
        AccreditationType accreditationType,
        string calldata notes
    ) external onlyRole(VERIFIER_ROLE) {
        VerificationRequest storage request = verificationRequests[requestId];
        require(!request.processed, "InvestorRegistry: already processed");
        require(request.investor != address(0), "InvestorRegistry: invalid request");
        
        request.processed = true;
        request.approved = approved;
        request.processorNotes = notes;
        
        InvestorProfile storage investor = investors[request.investor];
        VerificationStatus oldStatus = investor.status;
        
        if (approved) {
            if (accreditationType != AccreditationType.None) {
                investor.status = VerificationStatus.Accredited;
                investor.accreditationType = accreditationType;
                accreditedInvestorCount++;
            } else {
                investor.status = VerificationStatus.Verified;
            }
            investor.verificationDate = block.timestamp;
            investor.expirationDate = block.timestamp + verificationValidityPeriod;
            verifiedInvestorCount++;
            
            emit InvestorVerified(
                request.investor,
                investor.status,
                accreditationType,
                investor.expirationDate
            );
        } else {
            investor.status = VerificationStatus.Rejected;
        }
        
        emit InvestorStatusChanged(request.investor, oldStatus, investor.status, notes);
        emit VerificationProcessed(requestId, request.investor, approved, notes);
    }
    
    /**
     * @notice Directly verify an investor (admin override)
     * @param investorAddress Address to verify
     * @param countryCode Country code
     * @param stateCode State code
     * @param accreditationType Accreditation type
     */
    function verifyInvestorDirect(
        address investorAddress,
        string calldata countryCode,
        string calldata stateCode,
        AccreditationType accreditationType
    ) external onlyRole(VERIFIER_ROLE) {
        require(investorAddress != address(0), "InvestorRegistry: invalid address");
        require(!restrictedCountries[countryCode], "InvestorRegistry: country restricted");
        
        InvestorProfile storage investor = investors[investorAddress];
        VerificationStatus oldStatus = investor.status;
        
        if (oldStatus == VerificationStatus.None) {
            totalInvestors++;
        }
        
        investor.countryCode = countryCode;
        investor.stateCode = stateCode;
        investor.verificationDate = block.timestamp;
        investor.expirationDate = block.timestamp + verificationValidityPeriod;
        
        if (accreditationType != AccreditationType.None) {
            investor.status = VerificationStatus.Accredited;
            investor.accreditationType = accreditationType;
            if (oldStatus != VerificationStatus.Accredited) {
                accreditedInvestorCount++;
            }
        } else {
            investor.status = VerificationStatus.Verified;
        }
        
        if (oldStatus != VerificationStatus.Verified && 
            oldStatus != VerificationStatus.Accredited) {
            verifiedInvestorCount++;
        }
        
        emit InvestorVerified(
            investorAddress,
            investor.status,
            accreditationType,
            investor.expirationDate
        );
    }
    
    /**
     * @notice Suspend an investor
     * @param investorAddress Address to suspend
     * @param reason Suspension reason
     */
    function suspendInvestor(address investorAddress, string calldata reason) 
        external 
        onlyRole(COMPLIANCE_ROLE) 
    {
        InvestorProfile storage investor = investors[investorAddress];
        require(
            investor.status != VerificationStatus.None,
            "InvestorRegistry: not registered"
        );
        
        VerificationStatus oldStatus = investor.status;
        investor.status = VerificationStatus.Suspended;
        investor.isRestricted = true;
        investor.restrictionReason = reason;
        
        if (oldStatus == VerificationStatus.Verified) {
            verifiedInvestorCount--;
        } else if (oldStatus == VerificationStatus.Accredited) {
            accreditedInvestorCount--;
            verifiedInvestorCount--;
        }
        
        emit InvestorStatusChanged(investorAddress, oldStatus, VerificationStatus.Suspended, reason);
        emit InvestorRestricted(investorAddress, reason);
    }
    
    /**
     * @notice Reinstate a suspended investor
     * @param investorAddress Address to reinstate
     */
    function reinstateInvestor(address investorAddress) 
        external 
        onlyRole(COMPLIANCE_ROLE) 
    {
        InvestorProfile storage investor = investors[investorAddress];
        require(
            investor.status == VerificationStatus.Suspended,
            "InvestorRegistry: not suspended"
        );
        
        // Restore to previous verified status based on accreditation
        if (investor.accreditationType != AccreditationType.None) {
            investor.status = VerificationStatus.Accredited;
            accreditedInvestorCount++;
        } else {
            investor.status = VerificationStatus.Verified;
        }
        verifiedInvestorCount++;
        
        investor.isRestricted = false;
        investor.restrictionReason = "";
        
        // Reset expiration if it passed during suspension
        if (investor.expirationDate < block.timestamp) {
            investor.expirationDate = block.timestamp + verificationValidityPeriod;
        }
        
        emit InvestorUnrestricted(investorAddress);
    }
    
    // ============ PROPERTY INTEGRATION ============
    
    /**
     * @notice Register a property token contract
     * @param propertyToken Address of the property token
     */
    function registerProperty(address propertyToken) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        require(propertyToken != address(0), "InvestorRegistry: invalid address");
        registeredProperties[propertyToken] = true;
        emit PropertyRegistered(propertyToken);
    }
    
    /**
     * @notice Record an investment (called by property tokens)
     * @param investor Investor address
     * @param amount Investment amount in USD
     */
    function recordInvestment(address investor, uint256 amount) external {
        require(registeredProperties[msg.sender], "InvestorRegistry: unregistered property");
        
        InvestorProfile storage profile = investors[investor];
        
        if (investorPropertyHoldings[investor][msg.sender] == 0) {
            profile.propertyCount++;
        }
        
        investorPropertyHoldings[investor][msg.sender] += amount;
        profile.totalInvested += amount;
        
        emit InvestmentRecorded(investor, msg.sender, amount);
    }
    
    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @notice Update country restriction
     * @param countryCode ISO country code
     * @param restricted Whether restricted
     */
    function setCountryRestriction(string calldata countryCode, bool restricted) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        restrictedCountries[countryCode] = restricted;
        emit CountryRestrictionUpdated(countryCode, restricted);
    }
    
    /**
     * @notice Update state restriction
     * @param stateCode State code
     * @param restricted Whether restricted
     */
    function setStateRestriction(string calldata stateCode, bool restricted) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        restrictedStates[stateCode] = restricted;
        emit StateRestrictionUpdated(stateCode, restricted);
    }
    
    /**
     * @notice Update verification validity period
     * @param newPeriod New period in seconds
     */
    function setVerificationValidityPeriod(uint256 newPeriod) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        require(newPeriod >= 30 days, "InvestorRegistry: period too short");
        verificationValidityPeriod = newPeriod;
    }
    
    /**
     * @notice Set accreditation threshold
     * @param threshold USD amount requiring accreditation
     */
    function setAccreditationThreshold(uint256 threshold) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        accreditationThreshold = threshold;
    }
    
    /**
     * @notice Pause registry
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @notice Unpause registry
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @notice Check if investor is verified and not expired
     * @param investor Address to check
     * @return Boolean indicating valid verification
     */
    function isVerified(address investor) external view returns (bool) {
        InvestorProfile storage profile = investors[investor];
        return (
            (profile.status == VerificationStatus.Verified ||
             profile.status == VerificationStatus.Accredited) &&
            profile.expirationDate > block.timestamp &&
            !profile.isRestricted
        );
    }
    
    /**
     * @notice Check if investor is accredited
     * @param investor Address to check
     * @return Boolean indicating accreditation status
     */
    function isAccredited(address investor) external view returns (bool) {
        InvestorProfile storage profile = investors[investor];
        return (
            profile.status == VerificationStatus.Accredited &&
            profile.expirationDate > block.timestamp &&
            !profile.isRestricted
        );
    }
    
    /**
     * @notice Check if investor can invest a specific amount
     * @param investor Address to check
     * @param amount Investment amount in USD
     * @return Boolean indicating eligibility
     */
    function canInvest(address investor, uint256 amount) external view returns (bool) {
        InvestorProfile storage profile = investors[investor];
        
        // Must be verified
        if (profile.status != VerificationStatus.Verified &&
            profile.status != VerificationStatus.Accredited) {
            return false;
        }
        
        // Must not be expired
        if (profile.expirationDate <= block.timestamp) {
            return false;
        }
        
        // Must not be restricted
        if (profile.isRestricted) {
            return false;
        }
        
        // Check accreditation requirement
        if (accreditationThreshold > 0 && 
            profile.totalInvested + amount > accreditationThreshold &&
            profile.status != VerificationStatus.Accredited) {
            return false;
        }
        
        return true;
    }
    
    /**
     * @notice Get investor profile
     * @param investor Address to query
     * @return Full investor profile
     */
    function getInvestorProfile(address investor) 
        external 
        view 
        returns (InvestorProfile memory) 
    {
        return investors[investor];
    }
    
    /**
     * @notice Get verification request details
     * @param requestId Request ID
     * @return Request details
     */
    function getVerificationRequest(uint256 requestId) 
        external 
        view 
        returns (VerificationRequest memory) 
    {
        return verificationRequests[requestId];
    }
    
    /**
     * @notice Get investor's holdings in a specific property
     * @param investor Investor address
     * @param propertyToken Property token address
     * @return Investment amount
     */
    function getPropertyHolding(address investor, address propertyToken) 
        external 
        view 
        returns (uint256) 
    {
        return investorPropertyHoldings[investor][propertyToken];
    }
    
    /**
     * @notice Check days until verification expires
     * @param investor Address to check
     * @return Days until expiration (0 if expired)
     */
    function daysUntilExpiration(address investor) external view returns (uint256) {
        InvestorProfile storage profile = investors[investor];
        if (profile.expirationDate <= block.timestamp) {
            return 0;
        }
        return (profile.expirationDate - block.timestamp) / 1 days;
    }
}
