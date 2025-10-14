import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useBlockchain } from '../contexts/BlockchainContext';
import { formatAddress, formatTimestamp, formatUSDC, fromBytes32 } from '../utils/format';
import { useTenantDeposit } from '../hooks/useTenantDeposit';

const VaultCard = ({ vaultId, vaultAddress, userRole, onRefresh }) => {
  const { account, getVaultContract, contracts } = useBlockchain();
  const { deposit, loading: depositLoading, error: depositError } = useTenantDeposit();
  const [vault, setVault] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const loadVaultDetails = async () => {
    try {
      setIsLoading(true);
      const vaultContract = getVaultContract(vaultAddress);
      
      if (!vaultContract) return;
      
      // Get vault details
      const landlord = await vaultContract.landlord();
      const tenant = await vaultContract.tenant();
      const depositAmount = await vaultContract.depositAmount();
      const startTs = await vaultContract.startTs();
      const endTs = await vaultContract.endTs();
      const deposited = await vaultContract.deposited();
      const settled = await vaultContract.settled();
      const propertyName = await vaultContract.propertyName();
      const propertyLocation = await vaultContract.propertyLocation();
      
      // Get aToken address from environment (same for all vaults on testnet)
      const aTokenAddress = import.meta.env.VITE_ATOKEN_ADDRESS;
      
      // Get current aToken balance and value
      let currentShareValue = depositAmount;
      if (deposited && !settled && aTokenAddress) {
        try {
          const aTokenContract = new ethers.Contract(
            aTokenAddress,
            ["function balanceOf(address account) external view returns (uint256)"],
            vaultContract.runner
          );
          const aTokenBalance = await aTokenContract.balanceOf(vaultAddress);
          currentShareValue = aTokenBalance;
        } catch (error) {
          console.error("Error getting aToken balance:", error);
        }
      }
      
      setVault({
        id: vaultId,
        address: vaultAddress,
        landlord,
        tenant,
        depositAmount,
        startTs,
        endTs,
        deposited,
        settled,
        propertyName: fromBytes32(propertyName),
        propertyLocation: fromBytes32(propertyLocation),
        currentShareValue
      });
      console.log("Loaded vault details:", vault);
    } catch (error) {
      console.error(`Error loading vault ${vaultId}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (vaultAddress) {
      loadVaultDetails();
    }
  }, [vaultAddress, getVaultContract]);

  const handleDeposit = async () => {
    if (!vault || !account) return;
    
    try {
      setIsActionLoading(true);
      console.log("Starting deposit process for vault:", vault.address);
      console.log("Deposit amount:", vault.depositAmount.toString());
      
      // Use the useTenantDeposit hook to handle approval + deposit in one flow
      const result = await deposit({
        provider: contracts.usdc.runner.provider,
        tenantAddress: account,
        depositAmount: vault.depositAmount.toString(),
        vaultAddress: vault.address,
        usdcAddress: contracts.usdc.target
      });
      
      console.log("Deposit result:", result);
      
      if (depositError) {
        console.error("Deposit error:", depositError);
        throw depositError;
      }
      
      alert('Deposit successful!');
      loadVaultDetails();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error depositing:', error);
      alert(`Error depositing: ${error.message}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSettle = async () => {
    if (!vault || !account) return;
    
    try {
      setIsActionLoading(true);
      
      const vaultContract = getVaultContract(vault.address);
      const settleTx = await vaultContract.settle();
      await settleTx.wait();
      
      alert('Vault settled successfully!');
      loadVaultDetails();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error settling vault:', error);
      alert(`Error settling vault: ${error.message}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6 mb-2"></div>
      </div>
    );
  }

  if (!vault) {
    return <div>Error loading vault</div>;
  }

  // The userRole is passed from parent component, but we still verify with contract data
  const isLandlord = userRole === 'landlord' && account?.toLowerCase() === vault.landlord.toLowerCase();
  const isTenant = userRole === 'tenant' && account?.toLowerCase() === vault.tenant.toLowerCase();
  const now = Math.floor(Date.now() / 1000);
  const canSettle = isLandlord && vault.deposited && !vault.settled && now >= Number(vault.endTs);
  const canDeposit = isTenant && !vault.deposited;

  // Determine card styling based on status and role
  let borderClass = userRole === 'landlord' ? 'border-blue-200' : 'border-green-200';
  let bgClass = 'bg-white';
  
  if (vault.settled) {
    borderClass = 'border-green-300';
    bgClass = 'bg-green-50';
  }
  
  return (
    <div className={`${bgClass} rounded-lg shadow-md p-4 border ${borderClass}`}>
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center mb-1">
            <h3 className="text-lg font-semibold mr-2">{vault.propertyName || `Vault #${vault.id}`}</h3>
            <span className={`px-2 py-0.5 text-xs rounded-full ${
              userRole === 'landlord' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
            }`}>
              {userRole === 'landlord' ? 'Landlord' : 'Tenant'}
            </span>
            {vault.settled && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800">
                Completed
              </span>
            )}
          </div>
          {vault.propertyLocation && (
            <p className="text-sm text-gray-600">{vault.propertyLocation}</p>
          )}
        </div>
        <span className={`px-2 py-1 text-xs rounded-full ${
          vault.settled
            ? 'bg-green-100 text-green-800'
            : vault.deposited
            ? 'bg-blue-100 text-blue-800'
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {vault.settled ? 'Settled' : vault.deposited ? 'Active' : 'Not Deposited'}
        </span>
      </div>
      
      <div className="mt-3 space-y-2 text-sm">
        <div className="grid grid-cols-2 gap-2">
          <p className="text-gray-600">Vault Address:</p>
          <p className="font-mono text-xs break-all">{formatAddress(vault.address)}</p>
          
          <p className="text-gray-600">Landlord:</p>
          <p className={isLandlord ? "font-medium text-blue-700" : ""}>
            {formatAddress(vault.landlord)} 
            {isLandlord && <span className="ml-1 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">You</span>}
          </p>
          
          <p className="text-gray-600">Tenant:</p>
          <p className={isTenant ? "font-medium text-green-700" : ""}>
            {formatAddress(vault.tenant)} 
            {isTenant && <span className="ml-1 text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full">You</span>}
          </p>
          
          <p className="text-gray-600">Deposit:</p>
          <p>{formatUSDC(vault.depositAmount)} USDC</p>
          
          <p className="text-gray-600">Start Date:</p>
          <p>{formatTimestamp(vault.startTs)}</p>
          
          <p className="text-gray-600">End Date:</p>
          <p>{formatTimestamp(vault.endTs)}</p>
          
          {vault.deposited && !vault.settled && (
            <>
              <p className="text-gray-600">aToken Balance:</p>
              <p className="font-mono text-xs text-purple-600">{formatUSDC(vault.currentShareValue || 0)} aUSDC</p>
              
              <p className="text-gray-600">Current Value:</p>
              <p className="font-semibold">{formatUSDC(vault.currentShareValue || 0)} USDC</p>
              
              <p className="text-gray-600">Yield Earned:</p>
              <p className={(vault.currentShareValue || 0n) > vault.depositAmount ? "text-green-600 font-semibold" : "text-gray-600"}>
                {formatUSDC((vault.currentShareValue || 0n) - vault.depositAmount)} USDC
              </p>
            </>
          )}
        </div>
      </div>
      
      {vault.deposited && !vault.settled && (
        <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded text-xs">
          <p className="font-semibold text-purple-800 mb-1">💰 Bonzo Finance Integration</p>
          <p className="text-gray-600">
            Funds are supplied to Bonzo Finance lending pool. The aToken balance represents your deposit plus accrued yield.
          </p>
          <p className="text-gray-500 mt-1 font-mono text-[10px] break-all">
            aToken: {import.meta.env.VITE_ATOKEN_ADDRESS}
          </p>
        </div>
      )}
      
      <div className="mt-4 flex justify-end space-x-2">
        {canDeposit && (
          <button 
            onClick={handleDeposit}
            disabled={isActionLoading || depositLoading}
            className={`px-3 py-1 rounded text-sm bg-blue-600 text-white ${
              (isActionLoading || depositLoading) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
            }`}
          >
            {(isActionLoading || depositLoading) ? 'Processing...' : 'Deposit & Supply'}
          </button>
        )}
        
        {canSettle && (
          <button
            onClick={handleSettle}
            disabled={isActionLoading}
            className={`px-3 py-1 rounded text-sm bg-green-600 text-white ${
              isActionLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'
            }`}
          >
            {isActionLoading ? 'Processing...' : 'Settle Vault'}
          </button>
        )}
      </div>
    </div>
  );
};

export default VaultCard;