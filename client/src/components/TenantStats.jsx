import { useMemo } from 'react';
import { ethers } from 'ethers';

export default function TenantStats({ vaults }) {
  const stats = useMemo(() => {
    const activeVaults = vaults.filter(v => v.deposited && !v.settled);
    const pendingVaults = vaults.filter(v => !v.deposited && !v.settled);

    // Total deposited security amount across all active agreements
    const totalDeposited = activeVaults.reduce((sum, vault) => {
      return sum + parseFloat(ethers.formatUnits(vault.depositAmount || '0', 6));
    }, 0);

    // Total yield generated (current aToken balance - deposit amount)
    const totalYield = activeVaults.reduce((sum, vault) => {
      const deposit = parseFloat(ethers.formatUnits(vault.depositAmount || '0', 6));
      const balance = parseFloat(ethers.formatUnits(vault.aTokenBalance || '0', 6));
      return sum + Math.max(0, balance - deposit);
    }, 0);

    // Average yield rate
    const avgYieldRate = totalDeposited > 0 ? (totalYield / totalDeposited) * 100 : 0;

    return {
      totalDeposited,
      totalYield,
      avgYieldRate,
      activeCount: activeVaults.length,
      pendingCount: pendingVaults.length
    };
  }, [vaults]);

  const StatCard = ({ title, value, subtitle, icon, gradient, isCurrency = false, isPercentage = false }) => (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 hover:bg-white/10 transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${gradient} flex items-center justify-center text-2xl`}>
          {icon}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white group-hover:scale-110 transition-transform inline-block">
            {isCurrency && '$'}
            {isCurrency 
              ? value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              : isPercentage
              ? value.toFixed(2)
              : value
            }
            {isPercentage && '%'}
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
      <h3 className="text-xl font-bold text-white mb-4">My Deposits Overview</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Total Deposited */}
        <StatCard
          title="Total Security Deposited"
          value={stats.totalDeposited}
          subtitle={`Across ${stats.activeCount} active agreement${stats.activeCount !== 1 ? 's' : ''}`}
          icon="💵"
          gradient="from-blue-600 to-blue-500"
          isCurrency
        />

        {/* Total Yield */}
        <StatCard
          title="Yield Generated"
          value={stats.totalYield}
          subtitle="Interest earned on deposits"
          icon="📈"
          gradient="from-green-600 to-green-500"
          isCurrency
        />

        {/* Yield Rate */}
        <StatCard
          title="Average Yield Rate"
          value={stats.avgYieldRate}
          subtitle="Current return on deposits"
          icon="🎯"
          gradient="from-purple-600 to-purple-500"
          isPercentage
        />
      </div>
    </div>
  );
}
