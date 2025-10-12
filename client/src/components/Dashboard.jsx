import { useState, useEffect } from 'react';
import { useBlockchain } from '../contexts/BlockchainContext';
import VaultCard from '../components/VaultCard';

const Dashboard = () => {
  const { contracts, account } = useBlockchain();
  const [vaults, setVaults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadVaults = async () => {
    if (!contracts.factory || !account) {
      setVaults([]);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Get the nextId to know how many vaults exist
      const nextId = await contracts.factory.nextId();
      const vaultList = [];
      
      // Loop through all vault IDs (1-indexed)
      for (let i = 1; i < Number(nextId); i++) {
        const vaultAddress = await contracts.factory.vaults(i);
        
        // Skip empty addresses
        if (vaultAddress === '0x0000000000000000000000000000000000000000') {
          continue;
        }
        
        vaultList.push({
          id: i,
          address: vaultAddress
        });
      }
      
      setVaults(vaultList);
    } catch (error) {
      console.error('Error loading vaults:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVaults();
  }, [contracts.factory, account]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Your Vaults</h2>
      
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
          <p className="text-gray-600">No vaults found. Create a new agreement to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vaults.map((vault) => (
            <VaultCard
              key={vault.id}
              vaultId={vault.id}
              vaultAddress={vault.address}
              onRefresh={loadVaults}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;