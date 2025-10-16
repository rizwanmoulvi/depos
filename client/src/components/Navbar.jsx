import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useBlockchain } from '../contexts/BlockchainContext';
import { showSuccess } from '../utils/toast';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { account, connectWallet, disconnectWallet } = useBlockchain();
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isWalletDropdownOpen, setIsWalletDropdownOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState('landlord'); // Default to landlord
  const dropdownRef = useRef(null);
  const walletDropdownRef = useRef(null);

  const isHome = location.pathname === '/';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsRoleDropdownOpen(false);
      }
      if (walletDropdownRef.current && !walletDropdownRef.current.contains(event.target)) {
        setIsWalletDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update selected role based on current path
  useEffect(() => {
    if (location.pathname === '/landlord') setSelectedRole('landlord');
    if (location.pathname === '/tenant') setSelectedRole('tenant');
  }, [location.pathname]);

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setIsRoleDropdownOpen(false);
    navigate(`/${role}`);
  };

  const handleConnectWallet = async () => {
    console.log('🔵 [Navbar] Connect button clicked');
    try {
      const success = await connectWallet();
      console.log('🔵 [Navbar] Connect result:', success);
      if (success) {
        console.log('✅ [Navbar] Wallet connected successfully');
      } else {
        console.log('❌ [Navbar] Wallet connection failed');
      }
    } catch (error) {
      console.error('❌ [Navbar] Error in handleConnectWallet:', error);
    }
  };

  const handleDisconnectWallet = () => {
    disconnectWallet();
    setIsWalletDropdownOpen(false);
    showSuccess('Wallet Disconnected', 'Your wallet has been disconnected');
    // Navigate to home if on a dashboard page
    if (location.pathname === '/landlord' || location.pathname === '/tenant') {
      navigate('/');
    }
  };

  const copyAddressToClipboard = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      showSuccess('Address Copied!', 'Wallet address copied to clipboard');
      setIsWalletDropdownOpen(false);
    }
  };

  const isOnDashboard = location.pathname === '/landlord' || location.pathname === '/tenant';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center font-bold text-white text-xl group-hover:scale-110 transition-transform">
              D
            </div>
            <span className="text-xl font-bold text-white">Depos Protocol</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            {!isHome && account && (
              <>
                {/* Role Selector Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all"
                  >
                    <span className="text-sm font-medium text-white capitalize">
                      {selectedRole}
                    </span>
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform ${
                        isRoleDropdownOpen ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {isRoleDropdownOpen && (
                    <div className="absolute top-full mt-2 w-48 bg-gray-800/95 backdrop-blur-xl rounded-lg border border-white/10 shadow-xl overflow-hidden">
                      <button
                        onClick={() => handleRoleChange('landlord')}
                        className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-white/10 transition-colors ${
                          selectedRole === 'landlord' ? 'bg-white/5' : ''
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 flex items-center justify-center text-lg">
                          🏠
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">Landlord</div>
                          <div className="text-xs text-gray-400">Manage properties</div>
                        </div>
                      </button>
                      <button
                        onClick={() => handleRoleChange('tenant')}
                        className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-white/10 transition-colors ${
                          selectedRole === 'tenant' ? 'bg-white/5' : ''
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-600 to-purple-500 flex items-center justify-center text-lg">
                          👤
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">Tenant</div>
                          <div className="text-xs text-gray-400">View agreements</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                {/* Role-specific Navigation */}
                {isOnDashboard && (
                  <>
                    {selectedRole === 'landlord' && (
                      <>
                        <Link
                          to="/landlord?tab=agreements"
                          className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
                        >
                          My Agreements
                        </Link>
                        <Link
                          to="/landlord?tab=create"
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold text-sm hover:shadow-lg hover:shadow-blue-500/50 transition-all hover:scale-105"
                        >
                          Create Agreement
                        </Link>
                      </>
                    )}
                    {selectedRole === 'tenant' && (
                      <Link
                        to="/tenant"
                        className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
                      >
                        My Agreements
                      </Link>
                    )}
                  </>
                )}
              </>
            )}
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center gap-4">
            {account ? (
              <div className="relative" ref={walletDropdownRef}>
                <button
                  onClick={() => setIsWalletDropdownOpen(!isWalletDropdownOpen)}
                  className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
                >
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm font-mono text-white">{formatAddress(account)}</span>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${
                      isWalletDropdownOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Wallet Dropdown Menu */}
                {isWalletDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-gray-800/95 backdrop-blur-xl rounded-lg border border-white/10 shadow-xl overflow-hidden">
                    {/* Wallet Address Section */}
                    <div className="px-4 py-3 border-b border-white/10">
                      <div className="text-xs text-gray-400 mb-1">Connected Wallet</div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-sm font-mono text-white">{formatAddress(account)}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="p-2">
                      <button
                        onClick={copyAddressToClipboard}
                        className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-white/10 rounded-lg transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">Copy Address</div>
                          <div className="text-xs text-gray-400">Copy to clipboard</div>
                        </div>
                      </button>

                      <button
                        onClick={handleDisconnectWallet}
                        className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-red-500/10 rounded-lg transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">Disconnect</div>
                          <div className="text-xs text-gray-400">Sign out wallet</div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleConnectWallet}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold text-sm hover:shadow-lg hover:shadow-blue-500/50 transition-all hover:scale-105"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
