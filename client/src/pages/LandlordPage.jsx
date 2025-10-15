import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import CreateAgreementForm from '../components/CreateAgreementForm';
import LandlordDashboard from '../components/LandlordDashboard';
import { useBlockchain } from '../contexts/BlockchainContext';

export default function LandlordPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') || 'agreements';
  const [activeTab, setActiveTab] = useState(tabFromUrl);
  const { account } = useBlockchain();
  const dashboardRef = useRef();

  // Sync state with URL
  useEffect(() => {
    setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleAgreementCreated = () => {
    // Switch to dashboard tab and refresh
    handleTabChange('agreements');
    if (dashboardRef.current?.refresh) {
      dashboardRef.current.refresh();
    }
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pt-24 pb-12 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-3xl mb-6 mx-auto">
            🔒
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Wallet Not Connected</h2>
          <p className="text-gray-400">Please connect your wallet to access the landlord dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
            Landlord Dashboard
          </h1>
          <p className="text-gray-400 text-lg">
            Create and manage your rental agreements
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-white/5 p-2 rounded-lg border border-white/10 inline-flex">
          <button
            onClick={() => handleTabChange('agreements')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'agreements'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            My Agreements
          </button>
          <button
            onClick={() => handleTabChange('create')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'create'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Create New
          </button>
        </div>

        {/* Content */}
        <div>
          {activeTab === 'agreements' ? (
            <LandlordDashboard ref={dashboardRef} />
          ) : (
            <div className="max-w-5xl mx-auto">
              <CreateAgreementForm onAgreementCreated={handleAgreementCreated} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
