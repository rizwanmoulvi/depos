import { ethers } from 'ethers';

export const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  // Convert BigInt to Number safely before multiplying
  const timestampNumber = typeof timestamp === 'bigint' ? Number(timestamp) : timestamp;
  return new Date(timestampNumber * 1000).toLocaleDateString();
};

export const formatUSDC = (amount) => {
  if (!amount) return '0';
  // USDC has 6 decimals
  const formatted = ethers.formatUnits(amount, 6);
  return parseFloat(formatted).toFixed(2);
};

export const parseUSDC = (amount) => {
  if (!amount) return '0';
  // USDC has 6 decimals
  return ethers.parseUnits(amount.toString(), 6);
};

export const toBytes32 = (string) => {
  // Converts string to bytes32
  const bytes32 = ethers.encodeBytes32String(string);
  return bytes32;
};

export const fromBytes32 = (bytes32) => {
  if (!bytes32 || bytes32 === '0x0000000000000000000000000000000000000000000000000000000000000000') {
    return '';
  }
  try {
    return ethers.decodeBytes32String(bytes32);
  } catch (error) {
    return '';
  }
};