import { useState } from "react";
import { ethers } from "ethers";
import ERC20_ABI from "../abis/ERC20.json";
import VAULT_ABI from "../abis/EscrowVault.json";

export function useTenantDeposit() {
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);

  async function deposit({
    provider,
    tenantAddress,
    depositAmount, // in smallest unit, e.g., 1 USDC = 1_000_000
    vaultAddress,
    usdcAddress,
  }) {
    try {
      setLoading(true);
      setError(null);

      // We shouldn't try to get signer from provider, we should use the provider which is already connected to the wallet
      // Instead, we'll use the ethers.BrowserProvider which directly interacts with the user's wallet

      // Use window.ethereum to ensure we're using the connected wallet
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const signer = await browserProvider.getSigner();

      // Step 1: Approve vault
      const usdcContract = new ethers.Contract(usdcAddress, ERC20_ABI, signer);
      const allowance = await usdcContract.allowance(tenantAddress, vaultAddress);

      if (allowance < depositAmount) {
        console.log("Requesting approval transaction...");
        const approveTx = await usdcContract.approve(vaultAddress, depositAmount);
        console.log("Approval transaction sent:", approveTx.hash);
        setTxHash(approveTx.hash);
        await approveTx.wait();
        console.log("Approval transaction confirmed");
      } else {
        console.log("Sufficient allowance already exists");
      }

      // Step 2: Deposit & supply
      console.log("Creating vault contract instance for address:", vaultAddress);
      const vaultContract = new ethers.Contract(vaultAddress, VAULT_ABI, signer);
      console.log("Requesting deposit transaction...");
      const depositTx = await vaultContract.depositAndSupply();
      console.log("Deposit transaction sent:", depositTx.hash);
      setTxHash(depositTx.hash);
      await depositTx.wait();
      console.log("Deposit transaction confirmed");

      setLoading(false);
      return depositTx.hash;
    } catch (err) {
      setLoading(false);
      setError(err);
      console.error(err);
    }
  }

  return { deposit, loading, txHash, error };
}