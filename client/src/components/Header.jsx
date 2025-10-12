import { useState } from 'react';
import { useBlockchain } from '../contexts/BlockchainContext';
import { formatAddress } from '../utils/format';

const Header = () => {
  const { account, connectWallet, networkError } = useBlockchain();

  return (
    <header className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">Escrow dApp</h1>
        <div>
          {account ? (
            <div className="flex items-center space-x-2">
              <span className="bg-gray-700 py-2 px-4 rounded-lg">
                {formatAddress(account)}
              </span>
            </div>
          ) : (
            <button
              onClick={connectWallet}
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