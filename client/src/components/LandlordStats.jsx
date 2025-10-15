import { useMemo } from 'react';
import { ethers } from 'ethers';

export default function LandlordStats({ vaults }) {
  const stats = useMemo(() => {
    const activeVaults = vaults.filter(v => v.deposited && !v.settled);
    const pendingVaults = vaults.filter(v => !v.deposited && !v.settled);
    const settledVaults = vaults.filter(v => v.settled);

    // Total security deposits from active agreements
    const totalActiveDeposits = activeVaults.reduce((sum, vault) => {
      return sum + parseFloat(ethers.formatUnits(vault.depositAmount || '0', 6));
    }, 0);

    // Total yield from active agreements (current aToken balance - deposit)
    const totalActiveYield = activeVaults.reduce((sum, vault) => {
      const deposit = parseFloat(ethers.formatUnits(vault.depositAmount || '0', 6));
      const balance = parseFloat(ethers.formatUnits(vault.aTokenBalance || '0', 6));
      return sum + Math.max(0, balance - deposit);
    }, 0);

    // Total yield earned from settled agreements
    const totalSettledYield = settledVaults.reduce((sum, vault) => {
      const deposit = parseFloat(ethers.formatUnits(vault.depositAmount || '0', 6));
      const balance = parseFloat(ethers.formatUnits(vault.aTokenBalance || '0', 6));
      return sum + Math.max(0, balance - deposit);
    }, 0);

    return {
      total: vaults.length,
      active: activeVaults.length,
      pending: pendingVaults.length,
      settled: settledVaults.length,
      totalActiveDeposits,
      totalActiveYield,
      totalSettledYield,
      totalYield: totalActiveYield + totalSettledYield
    };
  }, [vaults]);

  const StatCard = ({ title, value, subtitle, icon, gradient, isCurrency = false }) => (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 hover:bg-white/10 transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${gradient} flex items-center justify-center text-2xl`}>
          {icon}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white group-hover:scale-110 transition-transform inline-block">
            {isCurrency && '$'}
            {isCurrency ? value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value}
          </div>
          <div className="text-xs text-gray-400 mt-1">{title}</div>
        </div>
      </div>
      {subtitle && (
        <div className="text-sm text-gray-400 border-t border-white/5 pt-3 mt-3">
          {subtitle}
        </div>
      )}
    </div>
  );

  return (
    <div className="mb-8">
      <h3 className="text-xl font-bold text-white mb-4">Portfolio Overview</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Agreements */}
        <StatCard
          title="Total Agreements"
          value={stats.total}
          subtitle={`${stats.active} Active • ${stats.pending} Pending • ${stats.settled} Settled`}
          icon="📋"
          gradient="from-blue-600 to-blue-500"
        />

        {/* Active Deposits */}
        <StatCard
          title="Active Deposits"
          value={stats.totalActiveDeposits}
          subtitle={`From ${stats.active} active agreement${stats.active !== 1 ? 's' : ''}`}
          icon="💰"
          gradient="from-green-600 to-green-500"
          isCurrency
        />

        {/* Active Yield */}
        <StatCard
          title="Active Yield"
          value={stats.totalActiveYield}
          subtitle="Currently earning interest"
          icon="📈"
          gradient="from-purple-600 to-purple-500"
          isCurrency
        />

        {/* Total Yield Earned */}
        <StatCard
          title="Total Yield Earned"
          value={stats.totalYield}
          subtitle={`${stats.settled} settled agreement${stats.settled !== 1 ? 's' : ''}`}
          icon="🎯"
          gradient="from-orange-600 to-orange-500"
          isCurrency
        />
      </div>
    </div>
  );
}
