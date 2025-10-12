import { useState, useEffect } from 'react';
import { useBlockchain } from '../contexts/BlockchainContext';
import { parseUSDC, formatUSDC } from '../utils/format';

const USDCFaucet = ({ onUSDCMinted }) => {
  const { account, contracts } = useBlockchain();
  const [amount, setAmount] = useState('100');
  const [balance, setBalance] = useState('0');
  const [isLoading, setIsLoading] = useState(false);

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

  const handleMint = async (e) => {
    e.preventDefault();
    
    if (!contracts.usdc || !account || !amount) return;
    
    try {
      setIsLoading(true);
      
      // Convert amount to USDC units (6 decimals)
      const amountInUnits = parseUSDC(amount);
      
      // Call faucet function
      const tx = await contracts.usdc.faucet(account, amountInUnits);
      await tx.wait();
      
      // Update balance
      const newBalance = await contracts.usdc.balanceOf(account);
      setBalance(formatUSDC(newBalance));
      
      alert('USDC minted successfully!');
      
      if (onUSDCMinted) {
        onUSDCMinted();
      }
    } catch (error) {
      console.error('Error minting USDC:', error);
      alert(`Error minting USDC: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!account) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">USDC Faucet</h2>
      
      <div className="mb-4">
        <p className="text-gray-600">Your Balance: <span className="font-semibold">{balance} USDC</span></p>
      </div>
      
      <form onSubmit={handleMint} className="space-y-4">
        <div>
          <label className="block text-gray-700 mb-1">Amount to Mint (USDC)</label>
          <input
            type="number"
            placeholder="100"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
            required
          />
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className={`px-4 py-2 rounded bg-green-600 text-white ${
              isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'
            }`}
          >
            {isLoading ? 'Minting...' : 'Get Test USDC'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default USDCFaucet;