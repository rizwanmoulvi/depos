import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useBlockchain } from '../contexts/BlockchainContext';
import { parseUSDC, formatUSDC } from '../utils/format';
import { useOwnerAccrue } from '../hooks/useOwnerAccrue';

const SimulateYield = ({ onYieldAdded }) => {
  const { account, contracts } = useBlockchain();
  const { accrue, loading: accrueLoading, error: accrueError } = useOwnerAccrue();
  const [yieldAmount, setYieldAmount] = useState('');
  const [sharePrice, setSharePrice] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const [isPoolOwner, setIsPoolOwner] = useState(false);

  useEffect(() => {
    const checkOwner = async () => {
      if (!contracts.pool || !account) return;
      
      try {
        const owner = await contracts.pool.owner();
        setIsPoolOwner(owner.toLowerCase() === account.toLowerCase());
        
        // Get current share price
        const currentSharePrice = await contracts.pool.sharePrice();
        setSharePrice(formatUSDC(currentSharePrice));
      } catch (error) {
        console.error('Error checking pool owner:', error);
      }
    };
    
    checkOwner();
  }, [contracts.pool, account]);

  const handleAddYield = async (e) => {
    e.preventDefault();
    
    if (!contracts.pool || !account || !yieldAmount) {
      console.log("Missing required data:", {
        poolContract: !!contracts.pool,
        account: !!account,
        yieldAmount
      });
      return;
    }
    
    try {
      setIsLoading(true);
      console.log("Starting accrue process");
      
      // Convert amount to USDC units (6 decimals)
      const amount = parseUSDC(yieldAmount);
      console.log("Parsed yield amount:", amount.toString());
      
      console.log("Contracts available:", {
        pool: contracts.pool.target,
        usdc: contracts.usdc.target
      });
      
      // Use the useOwnerAccrue hook to handle approval + accrue in one flow
      const result = await accrue({
        provider: contracts.usdc.runner.provider,
        ownerAddress: account,
        accrueAmount: amount,
        poolAddress: contracts.pool.target,
        usdcAddress: contracts.usdc.target
      });
      
      console.log("Accrue result:", result);
      
      if (accrueError) {
        console.error("Accrue error:", accrueError);
        throw accrueError;
      }
      
      // Update share price - use the same BrowserProvider pattern
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const signer = await browserProvider.getSigner();
      const poolContract = new ethers.Contract(contracts.pool.target, contracts.pool.interface, signer);
      const newSharePrice = await poolContract.sharePrice();
      setSharePrice(formatUSDC(newSharePrice));
      
      setYieldAmount('');
      alert('Yield added successfully!');
      
      if (onYieldAdded) {
        onYieldAdded();
      }
    } catch (error) {
      console.error('Error adding yield:', error);
      alert(`Error adding yield: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Only show for pool owner
  if (!isPoolOwner) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Simulate Yield (Admin Only)</h2>
      
      <div className="mb-4">
        <p className="text-gray-600">Current Share Price: <span className="font-semibold">{sharePrice} USDC</span></p>
      </div>
      
      <form onSubmit={handleAddYield} className="space-y-4">
        <div>
          <label className="block text-gray-700 mb-1">Add Yield Amount (USDC)</label>
          <input
            type="number"
            placeholder="100"
            value={yieldAmount}
            onChange={(e) => setYieldAmount(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
            required
          />
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading || accrueLoading}
            className={`px-4 py-2 rounded bg-purple-600 text-white ${
              (isLoading || accrueLoading) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-700'
            }`}
          >
            {(isLoading || accrueLoading) ? 'Processing...' : 'Add Yield'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SimulateYield;