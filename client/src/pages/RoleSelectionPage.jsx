import { useNavigate } from 'react-router-dom';
import { useBlockchain } from '../contexts/BlockchainContext';

export default function RoleSelectionPage() {
  const navigate = useNavigate();
  const { account, connectWallet } = useBlockchain();

  const handleRoleSelect = async (role) => {
    if (!account) {
      await connectWallet();
    }
    navigate(`/${role}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
            Choose Your Role
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Select whether you're a landlord creating agreements or a tenant managing deposits
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Landlord Card */}
          <div
            onClick={() => handleRoleSelect('landlord')}
            className="group relative p-8 rounded-2xl bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-500/20 hover:border-blue-500/50 cursor-pointer transition-all hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/0 to-purple-600/0 group-hover:from-blue-600/10 group-hover:to-purple-600/10 rounded-2xl transition-all"></div>
            
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 flex items-center justify-center text-3xl mb-6">
                🏠
              </div>
              
              <h2 className="text-3xl font-bold text-white mb-4">Landlord</h2>
              
              <p className="text-gray-300 mb-6 leading-relaxed">
                Create rental agreements, manage deposits, and track yield generation for your properties.
              </p>

              <ul className="space-y-3 mb-8">
                {[
                  'Create new agreements',
                  'Set deposit amounts',
                  'Manage multiple properties',
                  'View yield earnings'
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-gray-400">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <span className="text-sm text-gray-400">Continue as Landlord</span>
                <svg className="w-6 h-6 text-blue-400 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </div>

          {/* Tenant Card */}
          <div
            onClick={() => handleRoleSelect('tenant')}
            className="group relative p-8 rounded-2xl bg-gradient-to-br from-purple-600/10 to-pink-600/10 border border-purple-500/20 hover:border-purple-500/50 cursor-pointer transition-all hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 to-pink-600/0 group-hover:from-purple-600/10 group-hover:to-pink-600/10 rounded-2xl transition-all"></div>
            
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center text-3xl mb-6">
                👤
              </div>
              
              <h2 className="text-3xl font-bold text-white mb-4">Tenant</h2>
              
              <p className="text-gray-300 mb-6 leading-relaxed">
                Review agreements, deposit funds securely, and earn yield on your rental deposits.
              </p>

              <ul className="space-y-3 mb-8">
                {[
                  'View available agreements',
                  'Deposit USDC securely',
                  'Track your deposits',
                  'Earn passive yield'
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-gray-400">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <span className="text-sm text-gray-400">Continue as Tenant</span>
                <svg className="w-6 h-6 text-purple-400 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {!account && (
          <div className="mt-12 text-center">
            <p className="text-gray-400 mb-4">Connect your wallet to continue</p>
            <button
              onClick={connectWallet}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-xl hover:shadow-blue-500/50 transition-all hover:scale-105"
            >
              Connect Wallet
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
