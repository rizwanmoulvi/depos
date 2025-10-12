import { useState, useEffect } from 'react';
import { useBlockchain } from '../contexts/BlockchainContext';
import { formatAddress, formatTimestamp, formatUSDC, fromBytes32 } from '../utils/format';
import { useTenantDeposit } from '../hooks/useTenantDeposit';

const VaultCard = ({ vaultId, vaultAddress, onRefresh }) => {
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
      const poolShares = await vaultContract.poolShares();
      
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
        poolShares
      });
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

  const isLandlord = account?.toLowerCase() === vault.landlord.toLowerCase();
  const isTenant = account?.toLowerCase() === vault.tenant.toLowerCase();
  const now = Math.floor(Date.now() / 1000);
  const canSettle = isLandlord && vault.deposited && !vault.settled && now >= Number(vault.endTs);
  const canDeposit = isTenant && !vault.deposited;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">{vault.propertyName || `Vault #${vault.id}`}</h3>
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
          <p className="text-gray-600">Landlord:</p>
          <p>{formatAddress(vault.landlord)} {isLandlord && <span className="text-xs bg-gray-100 px-1 rounded">(You)</span>}</p>
          
          <p className="text-gray-600">Tenant:</p>
          <p>{formatAddress(vault.tenant)} {isTenant && <span className="text-xs bg-gray-100 px-1 rounded">(You)</span>}</p>
          
          <p className="text-gray-600">Deposit:</p>
          <p>{formatUSDC(vault.depositAmount)} USDC</p>
          
          <p className="text-gray-600">Start Date:</p>
          <p>{formatTimestamp(vault.startTs)}</p>
          
          <p className="text-gray-600">End Date:</p>
          <p>{formatTimestamp(vault.endTs)}</p>
        </div>
      </div>
      
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