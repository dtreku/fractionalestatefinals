// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title PropertyGovernance
 * @author Blockchain Course Group
 * @notice Governance contract for property-level decision making
 * @dev Enables shareholders to propose and vote on property-related decisions
 */

interface IFractionalEstate {
    function balanceOf(address account, uint256 id) external view returns (uint256);
    function totalSupply(uint256 id) external view returns (uint256);
}

contract PropertyGovernance is AccessControl, ReentrancyGuard {
    using Counters for Counters.Counter;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");

    IFractionalEstate public fractionalEstate;
    Counters.Counter private _proposalIdCounter;

    uint256 public votingPeriod = 7 days;
    uint256 public quorumPercentage = 25;
    uint256 public approvalThreshold = 51;
    uint256 public proposalThreshold = 1;
    uint256 public executionDelay = 2 days;

    enum ProposalState { Pending, Active, Defeated, Succeeded, Queued, Executed, Cancelled }
    enum ProposalType { General, Renovation, Management, Sale, Distribution, Emergency }

    struct Proposal {
        uint256 id;
        uint256 propertyId;
        address proposer;
        string title;
        string description;
        ProposalType proposalType;
        uint256 startTime;
        uint256 endTime;
        uint256 executionTime;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bool executed;
        bool cancelled;
        bytes callData;
        address targetContract;
    }

    struct Vote {
        bool hasVoted;
        uint8 support;
        uint256 weight;
    }

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => Vote)) public proposalVotes;
    mapping(uint256 => uint256[]) public propertyProposals;

    event ProposalCreated(uint256 indexed proposalId, uint256 indexed propertyId, address indexed proposer, string title, ProposalType proposalType, uint256 startTime, uint256 endTime);
    event VoteCast(uint256 indexed proposalId, address indexed voter, uint8 support, uint256 weight, string reason);
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCancelled(uint256 indexed proposalId, string reason);

    error NotEnoughShares();
    error ProposalNotFound();
    error ProposalNotActive();
    error AlreadyVoted();
    error ProposalNotSucceeded();
    error ExecutionDelayNotMet();
    error ProposalAlreadyExecuted();
    error InvalidVoteType();
    error NoVotingPower();

    constructor(address _fractionalEstate) {
        require(_fractionalEstate != address(0), "Invalid contract address");
        fractionalEstate = IFractionalEstate(_fractionalEstate);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(EXECUTOR_ROLE, msg.sender);
    }

    function createProposal(
        uint256 _propertyId,
        string memory _title,
        string memory _description,
        ProposalType _proposalType,
        bytes memory _callData,
        address _targetContract
    ) external returns (uint256) {
        uint256 voterShares = fractionalEstate.balanceOf(msg.sender, _propertyId);
        if (voterShares < proposalThreshold) revert NotEnoughShares();

        _proposalIdCounter.increment();
        uint256 proposalId = _proposalIdCounter.current();

        proposals[proposalId] = Proposal({
            id: proposalId,
            propertyId: _propertyId,
            proposer: msg.sender,
            title: _title,
            description: _description,
            proposalType: _proposalType,
            startTime: block.timestamp,
            endTime: block.timestamp + votingPeriod,
            executionTime: 0,
            forVotes: 0,
            againstVotes: 0,
            abstainVotes: 0,
            executed: false,
            cancelled: false,
            callData: _callData,
            targetContract: _targetContract
        });

        propertyProposals[_propertyId].push(proposalId);
        emit ProposalCreated(proposalId, _propertyId, msg.sender, _title, _proposalType, block.timestamp, block.timestamp + votingPeriod);
        return proposalId;
    }

    function castVote(uint256 _proposalId, uint8 _support, string memory _reason) external {
        Proposal storage proposal = proposals[_proposalId];
        if (proposal.id == 0) revert ProposalNotFound();
        if (getProposalState(_proposalId) != ProposalState.Active) revert ProposalNotActive();
        if (proposalVotes[_proposalId][msg.sender].hasVoted) revert AlreadyVoted();
        if (_support > 2) revert InvalidVoteType();

        uint256 weight = fractionalEstate.balanceOf(msg.sender, proposal.propertyId);
        if (weight == 0) revert NoVotingPower();

        proposalVotes[_proposalId][msg.sender] = Vote({ hasVoted: true, support: _support, weight: weight });

        if (_support == 0) proposal.againstVotes += weight;
        else if (_support == 1) proposal.forVotes += weight;
        else proposal.abstainVotes += weight;

        emit VoteCast(_proposalId, msg.sender, _support, weight, _reason);
    }

    function executeProposal(uint256 _proposalId) external nonReentrant onlyRole(EXECUTOR_ROLE) {
        Proposal storage proposal = proposals[_proposalId];
        if (proposal.id == 0) revert ProposalNotFound();
        if (getProposalState(_proposalId) != ProposalState.Succeeded) revert ProposalNotSucceeded();
        if (proposal.executed) revert ProposalAlreadyExecuted();
        
        if (proposal.executionTime == 0) {
            proposal.executionTime = block.timestamp + executionDelay;
            return;
        }
        if (block.timestamp < proposal.executionTime) revert ExecutionDelayNotMet();

        proposal.executed = true;
        if (proposal.callData.length > 0 && proposal.targetContract != address(0)) {
            (bool success, ) = proposal.targetContract.call(proposal.callData);
            require(success, "Execution failed");
        }
        emit ProposalExecuted(_proposalId);
    }

    function cancelProposal(uint256 _proposalId, string memory _reason) external {
        Proposal storage proposal = proposals[_proposalId];
        if (proposal.id == 0) revert ProposalNotFound();
        require(msg.sender == proposal.proposer || hasRole(ADMIN_ROLE, msg.sender), "Not authorized");
        require(!proposal.executed && !proposal.cancelled, "Invalid state");
        proposal.cancelled = true;
        emit ProposalCancelled(_proposalId, _reason);
    }

    function getProposalState(uint256 _proposalId) public view returns (ProposalState) {
        Proposal storage proposal = proposals[_proposalId];
        if (proposal.id == 0) return ProposalState.Pending;
        if (proposal.cancelled) return ProposalState.Cancelled;
        if (proposal.executed) return ProposalState.Executed;
        if (block.timestamp < proposal.endTime) return ProposalState.Active;

        uint256 totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
        uint256 totalSupply = fractionalEstate.totalSupply(proposal.propertyId);
        if (totalSupply == 0 || totalVotes < (totalSupply * quorumPercentage) / 100) return ProposalState.Defeated;

        uint256 totalValidVotes = proposal.forVotes + proposal.againstVotes;
        if (totalValidVotes == 0 || (proposal.forVotes * 100) / totalValidVotes < approvalThreshold) return ProposalState.Defeated;

        return proposal.executionTime > 0 ? ProposalState.Queued : ProposalState.Succeeded;
    }

    function getProposal(uint256 _proposalId) external view returns (Proposal memory) { return proposals[_proposalId]; }
    function getPropertyProposals(uint256 _propertyId) external view returns (uint256[] memory) { return propertyProposals[_propertyId]; }
    function getVote(uint256 _proposalId, address _voter) external view returns (Vote memory) { return proposalVotes[_proposalId][_voter]; }
    function getVotingPower(address _voter, uint256 _propertyId) external view returns (uint256) { return fractionalEstate.balanceOf(_voter, _propertyId); }
    function getTotalProposals() external view returns (uint256) { return _proposalIdCounter.current(); }

    function updateGovernanceParameters(uint256 _votingPeriod, uint256 _quorumPercentage, uint256 _approvalThreshold) external onlyRole(ADMIN_ROLE) {
        require(_votingPeriod >= 1 days && _quorumPercentage <= 100 && _approvalThreshold <= 100, "Invalid params");
        votingPeriod = _votingPeriod;
        quorumPercentage = _quorumPercentage;
        approvalThreshold = _approvalThreshold;
    }
}
