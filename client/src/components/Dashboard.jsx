import { useState, useEffect } from 'react';
import { useBlockchain } from '../contexts/BlockchainContext';
import VaultCard from '../components/VaultCard';
import { ethers } from 'ethers';
import EscrowVaultABI from '../abis/EscrowVault.json';

const Dashboard = () => {
  const { contracts, account, provider, getVaultContract } = useBlockchain();
  const [vaults, setVaults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadVaults = async () => {
    if (!contracts.factory || !account || !getVaultContract) {
      setVaults([]);
      setIsLoading(false);
      console.log("Missing required context:", { 
        hasFactory: !!contracts.factory, 
        hasAccount: !!account,
        hasGetVaultContract: !!getVaultContract
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Get the nextId to know how many vaults exist
      const nextId = await contracts.factory.nextId();
      const vaultList = [];
      
      // Loop through all vault IDs (1-indexed)
      for (let i = 1; i < Number(nextId); i++) {
        try {
          const vaultAddress = await contracts.factory.vaults(i);
          
          // Skip empty addresses
          if (vaultAddress === '0x0000000000000000000000000000000000000000') {
            continue;
          }
          
          // Get vault contract and check if user is landlord or tenant
          const vaultContract = getVaultContract(vaultAddress);
          
          if (!vaultContract) {
            console.error(`Failed to get vault contract for address: ${vaultAddress}`);
            continue;
          }
          
          const landlord = await vaultContract.landlord();
          const tenant = await vaultContract.tenant();
          const settled = await vaultContract.settled();
          const deposited = await vaultContract.deposited();
          
          // Add vaults where current account is either landlord or tenant
          // Always show them regardless of the settled status
          if (
            account.toLowerCase() === landlord.toLowerCase() ||
            account.toLowerCase() === tenant.toLowerCase()
          ) {
            vaultList.push({
              id: i,
              address: vaultAddress,
              role: account.toLowerCase() === landlord.toLowerCase() ? 'landlord' : 'tenant',
              settled: settled,
              deposited: deposited
            });
          }
        } catch (error) {
          console.error('Error loading vault details:', error);
          console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            vaultId: i,
            vaultAddress
          });
        }
      }
      
      // Sort vaults: Active first, then Not Deposited, then Settled
      const sortedVaults = vaultList.sort((a, b) => {
        // Active vaults (deposited but not settled) first
        if (a.deposited && !a.settled && !(b.deposited && !b.settled)) return -1;
        if (b.deposited && !b.settled && !(a.deposited && !a.settled)) return 1;
        
        // Not deposited vaults next
        if (!a.deposited && b.deposited) return -1;
        if (!b.deposited && a.deposited) return 1;
        
        // Settled vaults last
        if (a.settled && !b.settled) return 1;
        if (b.settled && !a.settled) return -1;
        
        // If same status, sort by ID
        return a.id - b.id;
      });
      
      setVaults(sortedVaults);
    } catch (error) {
      console.error('Error loading vaults:', error);
      console.log('Context info:', { 
        factoryAddress: contracts.factory?.target,
        hasProvider: !!provider,
        hasAccount: !!account
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVaults();
  }, [contracts.factory, account, provider, getVaultContract]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Your Escrow Vaults</h2>
      <p className="text-gray-600 mb-4">View all your active, pending, and completed escrow agreements.</p>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6 mb-2"></div>
            </div>
          ))}
        </div>
      ) : vaults.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-600">You don't have any escrow agreements. Create a new agreement as a landlord or ask a landlord to include you as a tenant.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Vaults Section */}
          {vaults.some(v => v.deposited && !v.settled) && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                Active Agreements
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vaults
                  .filter(v => v.deposited && !v.settled)
                  .map(vault => (
                    <VaultCard
                      key={vault.id}
                      vaultId={vault.id}
                      vaultAddress={vault.address}
                      userRole={vault.role}
                      onRefresh={loadVaults}
                    />
                  ))}
              </div>
            </div>
          )}
          
          {/* Pending Vaults Section */}
          {vaults.some(v => !v.deposited) && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <span className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
                Pending Agreements
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vaults
                  .filter(v => !v.deposited)
                  .map(vault => (
                    <VaultCard
                      key={vault.id}
                      vaultId={vault.id}
                      vaultAddress={vault.address}
                      userRole={vault.role}
                      onRefresh={loadVaults}
                    />
                  ))}
              </div>
            </div>
          )}
          
          {/* Settled Vaults Section */}
          {vaults.some(v => v.settled) && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                Completed Agreements
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vaults
                  .filter(v => v.settled)
                  .map(vault => (
                    <VaultCard
                      key={vault.id}
                      vaultId={vault.id}
                      vaultAddress={vault.address}
                      userRole={vault.role}
                      onRefresh={loadVaults}
                    />
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;