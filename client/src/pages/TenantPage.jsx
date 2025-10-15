import TenantDashboard from '../components/TenantDashboard';
import { useBlockchain } from '../contexts/BlockchainContext';

export default function TenantPage() {
  const { account } = useBlockchain();

  if (!account) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pt-24 pb-12 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-3xl mb-6 mx-auto">
            🔒
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Wallet Not Connected</h2>
          <p className="text-gray-400">Please connect your wallet to access the tenant dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-purple-100 to-pink-200 bg-clip-text text-transparent">
            Tenant Dashboard
          </h1>
          <p className="text-gray-400 text-lg">
            View and manage your rental deposits
          </p>
        </div>

        {/* Content */}
        <TenantDashboard />
      </div>
    </div>
  );
}
