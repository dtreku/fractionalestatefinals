import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAddress(address: string): string {
  if (!address) return ""
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function formatEther(wei: string | bigint): string {
  const value = typeof wei === "string" ? BigInt(wei) : wei
  return (Number(value) / 1e18).toFixed(4)
}

export function formatUSD(eth: number, ethPrice: number = 1800): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(eth * ethPrice)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date))
}

export function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`
}
