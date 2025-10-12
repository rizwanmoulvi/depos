import { useState } from "react";
import { ethers } from "ethers";
import ERC20_ABI from "../abis/ERC20.json";
import POOL_ABI from "../abis/MockAutoPool.json";

export function useOwnerAccrue() {
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);

  async function accrue({
    provider,
    ownerAddress,
    accrueAmount, // in smallest unit, e.g., 0.2 USDC = 200_000
    poolAddress,
    usdcAddress,
  }) {
    try {
      setLoading(true);
      setError(null);

      // Use window.ethereum to ensure we're using the connected wallet
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const signer = await browserProvider.getSigner();

      // Step 1: Approve pool
      console.log("Creating USDC contract instance for address:", usdcAddress);
      const usdcContract = new ethers.Contract(usdcAddress, ERC20_ABI, signer);
      
      console.log("Checking allowance for owner:", ownerAddress, "to pool:", poolAddress);
      const allowance = await usdcContract.allowance(ownerAddress, poolAddress);
      console.log("Current allowance:", allowance.toString(), "Required amount:", accrueAmount.toString());

      if (allowance < accrueAmount) {
        console.log("Requesting approval transaction...");
        const approveTx = await usdcContract.approve(poolAddress, accrueAmount);
        console.log("Approval transaction sent:", approveTx.hash);
        setTxHash(approveTx.hash);
        await approveTx.wait();
        console.log("Approval transaction confirmed");
      } else {
        console.log("Sufficient allowance already exists");
      }

      // Step 2: Call accrue
      console.log("Creating pool contract instance for address:", poolAddress);
      const poolContract = new ethers.Contract(poolAddress, POOL_ABI, signer);
      console.log("Requesting accrue transaction with amount:", accrueAmount.toString());
      const accrueTx = await poolContract.accrue(accrueAmount);
      console.log("Accrue transaction sent:", accrueTx.hash);
      setTxHash(accrueTx.hash);
      await accrueTx.wait();
      console.log("Accrue transaction confirmed");

      setLoading(false);
      return accrueTx.hash;
    } catch (err) {
      setLoading(false);
      setError(err);
      console.error(err);
    }
  }

  return { accrue, loading, txHash, error };
}