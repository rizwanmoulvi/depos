import { useState, useEffect, useRef } from 'react';
import { useBlockchain } from '../contexts/BlockchainContext';
import { formatAddress } from '../utils/format';

const Header = () => {
  const { account, connectWallet, disconnectWallet, networkError, isAutoConnecting } = useBlockchain();
  const [showDisconnect, setShowDisconnect] = useState(false);
  const dropdownRef = useRef(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDisconnect(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">Escrow dApp</h1>
        <div>
          {account ? (
            <div className="flex items-center space-x-2 relative" ref={dropdownRef}>
              <span 
                className="bg-gray-700 py-2 px-4 rounded-lg cursor-pointer flex items-center"
                onClick={() => setShowDisconnect(!showDisconnect)}
              >
                {formatAddress(account)}
                <svg className={`ml-2 h-4 w-4 transition-transform ${showDisconnect ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </span>
              
              {showDisconnect && (
                <div className="absolute right-0 mt-12 w-48 bg-gray-800 rounded-md shadow-lg z-20">
                  <button
                    onClick={() => {
                      disconnectWallet();
                      setShowDisconnect(false);
                    }}
                    className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 rounded-md flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Disconnect Wallet
                  </button>
                </div>
              )}
            </div>
          ) : isAutoConnecting ? (
            <button
              disabled
              className="bg-gray-600 py-2 px-4 rounded-lg opacity-75 flex items-center"
            >
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Connecting...
            </button>
          ) : (
            <button
              onClick={() => connectWallet(false)}
              className="bg-blue-600 hover:bg-blue-700 py-2 px-4 rounded-lg transition"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
      {networkError && (
        <div className="bg-red-600 text-white p-2 text-center">
          {networkError}
        </div>
      )}
    </header>
  );
};

export default Header;