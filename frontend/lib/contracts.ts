// Contract Addresses - Update after deployment
export const FRACTIONALESTATE_ADDRESS = process.env.NEXT_PUBLIC_FRACTIONALESTATE_ADDRESS as `0x${string}` || "0x0000000000000000000000000000000000000000";
export const GOVERNANCE_ADDRESS = process.env.NEXT_PUBLIC_GOVERNANCE_ADDRESS as `0x${string}` || "0x0000000000000000000000000000000000000000";

// FractionalEstate ABI (key functions)
export const FRACTIONALESTATE_ABI = [
  // Read Functions
  {
    name: "getProperty",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "_propertyId", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "id", type: "uint256" },
          { name: "name", type: "string" },
          { name: "location", type: "string" },
          { name: "propertyType", type: "string" },
          { name: "totalValue", type: "uint256" },
          { name: "totalShares", type: "uint256" },
          { name: "availableShares", type: "uint256" },
          { name: "pricePerShare", type: "uint256" },
          { name: "annualYieldBps", type: "uint256" },
          { name: "listingTimestamp", type: "uint256" },
          { name: "fundingDeadline", type: "uint256" },
          { name: "isActive", type: "bool" },
          { name: "isFunded", type: "bool" },
          { name: "propertyManager", type: "address" },
          { name: "metadataURI", type: "string" },
        ],
      },
    ],
  },
  {
    name: "getInvestor",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "_investor", type: "address" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "wallet", type: "address" },
          { name: "isVerified", type: "bool" },
          { name: "isAccredited", type: "bool" },
          { name: "verificationTimestamp", type: "uint256" },
          { name: "totalInvested", type: "uint256" },
          { name: "propertyIds", type: "uint256[]" },
        ],
      },
    ],
  },
  {
    name: "getShareBalance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "_investor", type: "address" },
      { name: "_propertyId", type: "uint256" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "getClaimableDividends",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "_propertyId", type: "uint256" },
      { name: "_investor", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "getTotalProperties",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "getInvestorProperties",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "_investor", type: "address" }],
    outputs: [{ type: "uint256[]" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "account", type: "address" },
      { name: "id", type: "uint256" },
    ],
    outputs: [{ type: "uint256" }],
  },
  // Write Functions
  {
    name: "purchaseShares",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "_propertyId", type: "uint256" },
      { name: "_shares", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "claimDividends",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "_propertyId", type: "uint256" }],
    outputs: [],
  },
] as const;

// PropertyGovernance ABI (key functions)
export const GOVERNANCE_ABI = [
  // Read Functions
  {
    name: "getProposal",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "_proposalId", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "id", type: "uint256" },
          { name: "propertyId", type: "uint256" },
          { name: "proposer", type: "address" },
          { name: "title", type: "string" },
          { name: "description", type: "string" },
          { name: "proposalType", type: "uint8" },
          { name: "startTime", type: "uint256" },
          { name: "endTime", type: "uint256" },
          { name: "executionTime", type: "uint256" },
          { name: "forVotes", type: "uint256" },
          { name: "againstVotes", type: "uint256" },
          { name: "abstainVotes", type: "uint256" },
          { name: "executed", type: "bool" },
          { name: "cancelled", type: "bool" },
          { name: "callData", type: "bytes" },
          { name: "targetContract", type: "address" },
        ],
      },
    ],
  },
  {
    name: "getProposalState",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "_proposalId", type: "uint256" }],
    outputs: [{ type: "uint8" }],
  },
  {
    name: "getPropertyProposals",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "_propertyId", type: "uint256" }],
    outputs: [{ type: "uint256[]" }],
  },
  {
    name: "getVote",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "_proposalId", type: "uint256" },
      { name: "_voter", type: "address" },
    ],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "hasVoted", type: "bool" },
          { name: "support", type: "uint8" },
          { name: "weight", type: "uint256" },
        ],
      },
    ],
  },
  {
    name: "getVotingPower",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "_voter", type: "address" },
      { name: "_propertyId", type: "uint256" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "getTotalProposals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  // Write Functions
  {
    name: "createProposal",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_propertyId", type: "uint256" },
      { name: "_title", type: "string" },
      { name: "_description", type: "string" },
      { name: "_proposalType", type: "uint8" },
      { name: "_callData", type: "bytes" },
      { name: "_targetContract", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "castVote",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_proposalId", type: "uint256" },
      { name: "_support", type: "uint8" },
      { name: "_reason", type: "string" },
    ],
    outputs: [],
  },
] as const;

// Proposal Types
export const PROPOSAL_TYPES = {
  0: "General",
  1: "Renovation",
  2: "Management",
  3: "Sale",
  4: "Distribution",
  5: "Emergency",
} as const;

// Proposal States
export const PROPOSAL_STATES = {
  0: "Pending",
  1: "Active",
  2: "Defeated",
  3: "Succeeded",
  4: "Queued",
  5: "Executed",
  6: "Cancelled",
} as const;

// Vote Support Types
export const VOTE_SUPPORT = {
  0: "Against",
  1: "For",
  2: "Abstain",
} as const;
