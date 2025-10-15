import { useState, useEffect, useCallback } from 'react';
import { useBlockchain } from '../contexts/BlockchainContext';
import VaultCard from './VaultCard';
import TenantStats from './TenantStats';

export default function TenantDashboard() {
  const { account, fetchAllVaults } = useBlockchain();
  const [vaults, setVaults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // all, active, pending, settled

  const loadVaults = useCallback(async (forceRefresh = false) => {
    if (!account || !fetchAllVaults) {
      console.log('Missing dependencies:', { hasAccount: !!account, hasFetchAllVaults: !!fetchAllVaults });
      setVaults([]);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('Loading vaults for tenant...');
      
      // Use cached fetch
      const allVaults = await fetchAllVaults(forceRefresh);
      
      // Filter for tenant's vaults
      const tenantVaults = allVaults.filter(vault => 
        account.toLowerCase() === vault.tenant.toLowerCase()
      );
      
      console.log(`Found ${tenantVaults.length} vaults for tenant out of ${allVaults.length} total`);
      
      // Sort vaults
      const sortedVaults = tenantVaults.sort((a, b) => {
        if (a.deposited && !a.settled && !(b.deposited && !b.settled)) return -1;
        if (b.deposited && !b.settled && !(a.deposited && !a.settled)) return 1;
        if (!a.deposited && b.deposited) return -1;
        if (!b.deposited && a.deposited) return 1;
        if (a.settled && !b.settled) return 1;
        if (b.settled && !a.settled) return -1;
        return a.id - b.id;
      });
      
      setVaults(sortedVaults);
    } catch (error) {
      console.error('Error loading vaults:', error);
    } finally {
      setIsLoading(false);
    }
  }, [account, fetchAllVaults]);

  useEffect(() => {
    loadVaults();
  }, [loadVaults]);

  // Filter vaults based on active tab
  const filteredVaults = vaults.filter(vault => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return vault.deposited && !vault.settled;
    if (activeTab === 'pending') return !vault.deposited && !vault.settled;
    if (activeTab === 'settled') return vault.settled;
    return true;
  });

  const TabButton = ({ id, label, count }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-6 py-3 rounded-lg font-medium transition-all ${
        activeTab === id
          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
          : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
      }`}
    >
      {label} {count !== undefined && (
        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
          activeTab === id ? 'bg-white/20' : 'bg-white/10'
        }`}>
          {count}
        </span>
      )}
    </button>
  );

  if (isLoading) {
    return (
      <div>
        <div className="animate-pulse mb-8">
          <div className="h-8 bg-white/10 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/5 rounded-xl border border-white/10 p-6">
                <div className="h-4 bg-white/10 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-white/10 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-white/10 rounded w-3/4"></div>
                <div className="h-4 bg-white/10 rounded w-1/2"></div>
                <div className="h-4 bg-white/10 rounded w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (vaults.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-12 text-center">
        <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 flex items-center justify-center text-3xl mb-4 mx-auto">
          👤
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">No Agreements Yet</h3>
        <p className="text-gray-400 mb-6">You haven't been assigned to any agreements yet</p>
      </div>
    );
  }

  const activeCount = vaults.filter(v => v.deposited && !v.settled).length;
  const pendingCount = vaults.filter(v => !v.deposited && !v.settled).length;
  const settledCount = vaults.filter(v => v.settled).length;

  return (
    <div>
      {/* Stats Section */}
      <TenantStats vaults={vaults} />

      {/* Tabs */}
      <div className="flex flex-wrap gap-3 mb-6">
        <TabButton id="all" label="All Agreements" count={vaults.length} />
        <TabButton id="active" label="Active" count={activeCount} />
        <TabButton id="pending" label="Pending" count={pendingCount} />
        <TabButton id="settled" label="Settled" count={settledCount} />
      </div>

      {/* Vaults Grid */}
      {filteredVaults.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-12 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-white mb-2">No {activeTab} agreements</h3>
          <p className="text-gray-400">Try selecting a different filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVaults.map((vault) => (
            <VaultCard
              key={vault.id}
              vaultId={vault.id}
              vaultAddress={vault.address}
              userRole="tenant"
              onRefresh={() => loadVaults(true)}
              cachedData={vault}
            />
          ))}
        </div>
      )}
    </div>
  );
}
