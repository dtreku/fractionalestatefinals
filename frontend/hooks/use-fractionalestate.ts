import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, formatEther } from "viem";
import { FRACTIONALESTATE_ABI, FRACTIONALESTATE_ADDRESS } from "@/lib/contracts";

// Hook to get property details
export function useProperty(propertyId: number) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: FRACTIONALESTATE_ADDRESS,
    abi: FRACTIONALESTATE_ABI,
    functionName: "getProperty",
    args: [BigInt(propertyId)],
  });

  return {
    property: data as any,
    isLoading,
    error,
    refetch,
  };
}

// Hook to get investor details
export function useInvestor(address: `0x${string}` | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: FRACTIONALESTATE_ADDRESS,
    abi: FRACTIONALESTATE_ABI,
    functionName: "getInvestor",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  return {
    investor: data as any,
    isLoading,
    error,
    refetch,
  };
}

// Hook to get share balance
export function useShareBalance(investor: `0x${string}` | undefined, propertyId: number) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: FRACTIONALESTATE_ADDRESS,
    abi: FRACTIONALESTATE_ABI,
    functionName: "getShareBalance",
    args: investor ? [investor, BigInt(propertyId)] : undefined,
    query: {
      enabled: !!investor,
    },
  });

  return {
    balance: data as bigint,
    isLoading,
    error,
    refetch,
  };
}

// Hook to get claimable dividends
export function useClaimableDividends(propertyId: number, investor: `0x${string}` | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: FRACTIONALESTATE_ADDRESS,
    abi: FRACTIONALESTATE_ABI,
    functionName: "getClaimableDividends",
    args: investor ? [BigInt(propertyId), investor] : undefined,
    query: {
      enabled: !!investor,
    },
  });

  return {
    claimable: data as bigint,
    isLoading,
    error,
    refetch,
  };
}

// Hook to purchase shares
export function usePurchaseShares() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const purchaseShares = async (propertyId: number, shares: number, pricePerShare: string) => {
    const totalCost = parseEther(pricePerShare) * BigInt(shares);
    
    writeContract({
      address: FRACTIONALESTATE_ADDRESS,
      abi: FRACTIONALESTATE_ABI,
      functionName: "purchaseShares",
      args: [BigInt(propertyId), BigInt(shares)],
      value: totalCost,
    });
  };

  return {
    purchaseShares,
    isPending,
    isConfirming,
    isSuccess,
    hash,
    error,
  };
}

// Hook to claim dividends
export function useClaimDividends() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claimDividends = async (propertyId: number) => {
    writeContract({
      address: FRACTIONALESTATE_ADDRESS,
      abi: FRACTIONALESTATE_ABI,
      functionName: "claimDividends",
      args: [BigInt(propertyId)],
    });
  };

  return {
    claimDividends,
    isPending,
    isConfirming,
    isSuccess,
    hash,
    error,
  };
}

// Hook to get total properties
export function useTotalProperties() {
  const { data, isLoading, error } = useReadContract({
    address: FRACTIONALESTATE_ADDRESS,
    abi: FRACTIONALESTATE_ABI,
    functionName: "getTotalProperties",
  });

  return {
    total: data as bigint,
    isLoading,
    error,
  };
}

// Hook to get investor properties
export function useInvestorProperties(investor: `0x${string}` | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: FRACTIONALESTATE_ADDRESS,
    abi: FRACTIONALESTATE_ABI,
    functionName: "getInvestorProperties",
    args: investor ? [investor] : undefined,
    query: {
      enabled: !!investor,
    },
  });

  return {
    propertyIds: data as bigint[],
    isLoading,
    error,
    refetch,
  };
}
