import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useBlockchain } from '../contexts/BlockchainContext';
import { formatAddress, formatTimestamp, formatUSDC, fromBytes32 } from '../utils/format';
import { useTenantDeposit } from '../hooks/useTenantDeposit';
import { showSuccess, showError } from '../utils/toast';

const VaultCard = ({ vaultId, vaultAddress, userRole, onRefresh, cachedData }) => {
  const { account, getVaultContract, contracts } = useBlockchain();
  const { deposit, loading: depositLoading, error: depositError } = useTenantDeposit();
  const [vault, setVault] = useState(cachedData || null);
  const [isLoading, setIsLoading] = useState(!cachedData);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const loadVaultDetails = async () => {
    // If we have cached data, use it and only fetch aToken balance
    if (cachedData) {
      try {
        const aTokenAddress = import.meta.env.VITE_ATOKEN_ADDRESS;
        let currentShareValue = cachedData.depositAmount;
        
        // Get fresh monthly rent data
        const vaultContract = getVaultContract(vaultAddress);
        let monthlyRent = cachedData.monthlyRent || 0n;
        let totalRentPaid = cachedData.totalRentPaid || 0n;
        let currentMonthIndex = cachedData.currentMonthIndex || 0n;
        
        if (vaultContract) {
          try {
            monthlyRent = await vaultContract.monthlyRent();
            totalRentPaid = await vaultContract.totalRentPaid();
            currentMonthIndex = await vaultContract.getCurrentMonthIndex();
          } catch (error) {
            console.error("Error getting rent data:", error);
          }
        }
        
        if (cachedData.deposited && !cachedData.settled && aTokenAddress) {
          try {
            const vaultContract = getVaultContract(vaultAddress);
            if (vaultContract) {
              const aTokenContract = new ethers.Contract(
                aTokenAddress,
                ["function balanceOf(address account) external view returns (uint256)"],
                vaultContract.runner
              );
              const aTokenBalance = await aTokenContract.balanceOf(vaultAddress);
              currentShareValue = aTokenBalance;
            }
          } catch (error) {
            console.error("Error getting aToken balance:", error);
          }
        }
        
        setVault({
          ...cachedData,
          propertyName: fromBytes32(cachedData.propertyName),
          propertyLocation: fromBytes32(cachedData.propertyLocation),
          monthlyRent,
          totalRentPaid,
          currentMonthIndex,
          currentShareValue
        });
        setIsLoading(false);
        return;
      } catch (error) {
        console.error("Error using cached data:", error);
      }
    }
    
    // Fallback to full fetch if no cached data
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
      const monthlyRent = await vaultContract.monthlyRent();
      const totalRentPaid = await vaultContract.totalRentPaid();
      const currentMonthIndex = await vaultContract.getCurrentMonthIndex();
      
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
        monthlyRent,
        totalRentPaid,
        currentMonthIndex,
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
      
      showSuccess('Deposit Successful!', `${formatUSDC(vault.depositAmount)} deposited to vault`);
      loadVaultDetails();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error depositing:', error);
      showError(error.message || 'Failed to deposit');
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
      
      showSuccess('Vault Settled!', 'Deposit has been returned with yield');
      loadVaultDetails();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error settling vault:', error);
      showError(error.message || 'Failed to settle vault');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handlePayRent = async (monthIndex) => {
    if (!vault || !account) return;
    
    try {
      setIsActionLoading(true);
      
      const vaultContract = getVaultContract(vault.address);
      
      // Check if already paid
      const isPaid = await vaultContract.isRentPaidForMonth(monthIndex);
      if (isPaid) {
        showWarning('Already Paid', `Rent for month ${monthIndex + 1} has already been paid`);
        return;
      }
      
      // Approve USDC transfer first
      const approveTx = await contracts.usdc.approve(vault.address, vault.monthlyRent);
      await approveTx.wait();
      
      // Pay rent
      const payTx = await vaultContract.payRent(monthIndex);
      await payTx.wait();
      
      showSuccess('Rent Paid!', `Successfully paid ${formatUSDC(vault.monthlyRent)} for month ${monthIndex + 1}`);
      loadVaultDetails();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error paying rent:', error);
      showError(error.message || 'Failed to pay rent');
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 animate-pulse">
        <div className="h-6 bg-white/10 rounded-lg w-3/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-white/10 rounded w-full"></div>
          <div className="h-4 bg-white/10 rounded w-5/6"></div>
          <div className="h-4 bg-white/10 rounded w-4/6"></div>
        </div>
      </div>
    );
  }

  if (!vault) {
    return (
      <div className="bg-red-500/10 backdrop-blur-xl rounded-2xl border border-red-500/20 p-6 text-center">
        <p className="text-red-400">Error loading vault</p>
      </div>
    );
  }

  // The userRole is passed from parent component, but we still verify with contract data
  const isLandlord = userRole === 'landlord' && account?.toLowerCase() === vault.landlord.toLowerCase();
  const isTenant = userRole === 'tenant' && account?.toLowerCase() === vault.tenant.toLowerCase();
  const now = Math.floor(Date.now() / 1000);
  const canSettle = isLandlord && vault.deposited && !vault.settled && now >= Number(vault.endTs);
  const canDeposit = isTenant && !vault.deposited;
  const canPayRent = isTenant && vault.monthlyRent > 0n && vault.deposited && !vault.settled;

  // Calculate yield
  const yieldEarned = (vault.currentShareValue || 0n) - vault.depositAmount;
  const hasYield = yieldEarned > 0n;

  // Status configuration
  const statusConfig = vault.settled 
    ? { label: 'Settled', icon: '✅', gradient: 'from-green-500 to-emerald-500', bg: 'bg-green-500/10', border: 'border-green-500/30' }
    : vault.deposited
    ? { label: 'Active', icon: '🔥', gradient: 'from-blue-500 to-purple-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30' }
    : { label: 'Pending', icon: '⏳', gradient: 'from-yellow-500 to-orange-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' };

  const roleConfig = userRole === 'landlord'
    ? { gradient: 'from-blue-600 to-blue-500', icon: '🏠', label: 'Landlord' }
    : { gradient: 'from-purple-600 to-purple-500', icon: '👤', label: 'Tenant' };
  
  return (
    <div className={`group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border ${statusConfig.border} 
                     hover:border-white/30 transition-all duration-300 overflow-hidden hover:shadow-2xl hover:shadow-${statusConfig.gradient}/10`}>
      {/* Gradient Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${statusConfig.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
      
      <div className="relative p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${roleConfig.gradient} flex items-center justify-center text-xl shadow-lg`}>
                {roleConfig.icon}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{vault.propertyName || `Agreement #${vault.id}`}</h3>
                {vault.propertyLocation && (
                  <p className="text-sm text-gray-400 flex items-center gap-1">
                    <span>📍</span>
                    {vault.propertyLocation}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${statusConfig.bg} border ${statusConfig.border} 
                           flex items-center gap-1.5 text-white shadow-lg`}>
              <span>{statusConfig.icon}</span>
              {statusConfig.label}
            </span>
            <span className={`px-3 py-1 rounded-lg text-xs font-medium bg-gradient-to-r ${roleConfig.gradient} 
                           text-white shadow-lg`}>
              {roleConfig.label}
            </span>
          </div>
        </div>

        {/* Parties Info */}
        <div className="grid grid-cols-1 gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400 flex items-center gap-2">
              <span>🏠</span>
              Landlord
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-white">{formatAddress(vault.landlord)}</span>
              {isLandlord && (
                <span className="px-2 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded-full text-xs text-blue-400 font-medium">
                  You
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400 flex items-center gap-2">
              <span>👤</span>
              Tenant
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-white">{formatAddress(vault.tenant)}</span>
              {isTenant && (
                <span className="px-2 py-0.5 bg-purple-500/20 border border-purple-500/30 rounded-full text-xs text-purple-400 font-medium">
                  You
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Financial Info */}
        <div className="space-y-3">
          {/* Deposit Amount */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 
                         rounded-xl border border-yellow-500/20">
            <span className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <span className="text-lg">💰</span>
              Security Deposit
            </span>
            <span className="text-xl font-bold text-white">
              ${formatUSDC(vault.depositAmount)}
            </span>
          </div>

          {/* Monthly Rent Info */}
          {vault.monthlyRent > 0n && (
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 
                           rounded-xl border border-blue-500/20">
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <span className="text-lg">🏠</span>
                  Monthly Rent
                </span>
                <div className="text-xl font-bold text-white mt-1">
                  ${formatUSDC(vault.monthlyRent)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400 mb-1">Total Paid</div>
                <div className="text-sm font-semibold text-blue-400">
                  ${formatUSDC(vault.totalRentPaid || 0)}
                </div>
              </div>
            </div>
          )}

          {/* Yield Info - Only for active vaults */}
          {vault.deposited && !vault.settled && (
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
                <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                  <span>📊</span>
                  Current Value
                </div>
                <div className="text-lg font-bold text-white">
                  ${formatUSDC(vault.currentShareValue || 0)}
                </div>
              </div>
              <div className={`p-4 rounded-xl border ${hasYield ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20' : 'bg-white/5 border-white/10'}`}>
                <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                  <span>📈</span>
                  Yield Earned
                </div>
                <div className={`text-lg font-bold ${hasYield ? 'text-green-400' : 'text-gray-400'}`}>
                  +${formatUSDC(yieldEarned)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
          <div className="flex-1">
            <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
              <span>📅</span>
              Start Date
            </div>
            <div className="text-sm font-medium text-white">{formatTimestamp(vault.startTs)}</div>
          </div>
          <div className="w-px h-10 bg-white/10"></div>
          <div className="flex-1">
            <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
              <span>🏁</span>
              End Date
            </div>
            <div className="text-sm font-medium text-white">{formatTimestamp(vault.endTs)}</div>
          </div>
        </div>

        {/* Bonzo Integration Info - Only for active vaults */}
        {vault.deposited && !vault.settled && (
          <div className="p-4 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-xl border border-purple-500/20">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🚀</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-purple-300 mb-1">Bonzo Finance Integration</div>
                <p className="text-xs text-gray-400 mb-2">
                  Your deposit is earning yield in the Bonzo lending pool
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500">aToken Balance:</span>
                  <span className="font-mono text-purple-400">{formatUSDC(vault.currentShareValue || 0)} aUSDC</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {(canDeposit || canSettle || canPayRent) && (
          <div className="flex gap-3 pt-4 border-t border-white/10">
            {canDeposit && (
              <button 
                onClick={handleDeposit}
                disabled={isActionLoading || depositLoading}
                className={`flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 
                          ${(isActionLoading || depositLoading)
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-xl hover:shadow-purple-500/50 hover:scale-105'
                          } flex items-center justify-center gap-2`}
              >
                {(isActionLoading || depositLoading) ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <span>💎</span>
                    Deposit & Supply
                  </>
                )}
              </button>
            )}
            
            {canPayRent && (
              <button
                onClick={() => handlePayRent(vault.currentMonthIndex)}
                disabled={isActionLoading}
                className={`flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200
                          ${isActionLoading
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:shadow-xl hover:shadow-blue-500/50 hover:scale-105'
                          } flex items-center justify-center gap-2`}
              >
                {isActionLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <span>🏠</span>
                    Pay Rent (Month {Number(vault.currentMonthIndex) + 1})
                  </>
                )}
              </button>
            )}
            
            {canSettle && (
              <button
                onClick={handleSettle}
                disabled={isActionLoading}
                className={`flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200
                          ${isActionLoading
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-xl hover:shadow-green-500/50 hover:scale-105'
                          } flex items-center justify-center gap-2`}
              >
                {isActionLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <span>✅</span>
                    Settle Vault
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VaultCard;