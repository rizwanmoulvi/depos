import { useState, useEffect } from 'react';
import { useBlockchain } from '../contexts/BlockchainContext';
import { formatUSDC } from '../utils/format';

const USDCFaucet = () => {
  const { account, contracts } = useBlockchain();
  const [balance, setBalance] = useState('0');

  useEffect(() => {
    const fetchBalance = async () => {
      if (!contracts.usdc || !account) return;
      
      try {
        const bal = await contracts.usdc.balanceOf(account);
        setBalance(formatUSDC(bal));
      } catch (error) {
        console.error('Error fetching USDC balance:', error);
      }
    };
    
    fetchBalance();
    
    // Set up interval to refresh balance
    const intervalId = setInterval(fetchBalance, 10000);
    
    return () => clearInterval(intervalId);
  }, [contracts.usdc, account]);

  if (!account) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">USDC Balance</h2>
      
      <div className="mb-4 p-4 bg-gray-50 rounded">
        <p className="text-gray-600 text-sm mb-2">Your USDC Balance:</p>
        <p className="text-3xl font-bold text-gray-800">{balance} USDC</p>
      </div>
      
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-semibold text-gray-800 mb-2">Get USDC on Hedera Testnet</h3>
        <p className="text-sm text-gray-600 mb-3">
          This is the real USDC token on Hedera Testnet. To get USDC:
        </p>
        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
          <li>Visit a Hedera Testnet faucet</li>
          <li>Bridge assets to Hedera Testnet</li>
          <li>Use a testnet exchange or swap</li>
          <li>Get USDC from the Bonzo Finance faucet if available</li>
        </ul>
        <div className="mt-3 p-2 bg-white rounded border border-gray-200">
          <p className="text-xs text-gray-500 font-mono break-all">
            USDC Contract: {import.meta.env.VITE_USDC_ADDRESS}
          </p>
        </div>
      </div>
    </div>
  );
};

export default USDCFaucet;