import { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { ethers } from 'ethers';

// ABIs
import EscrowFactoryABI from '../abis/EscrowFactory.json';
import EscrowVaultABI from '../abis/EscrowVault.json';
import MockAutoPoolABI from '../abis/MockAutoPool.json';
import MockUSDCABI from '../abis/MockUSDC.json';

export const BlockchainContext = createContext();

export const useBlockchain = () => useContext(BlockchainContext);

export const BlockchainProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contracts, setContracts] = useState({
    factory: null,
    usdc: null,
    pool: null
  });
  const [networkError, setNetworkError] = useState(null);

  const connectWallet = useCallback(async () => {
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask');
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      setChainId(network.chainId);
      
      // Check if correct network
      const targetChainId = import.meta.env.VITE_CHAIN_ID;
      if (network.chainId.toString() !== targetChainId) {
        setNetworkError(`Please switch to the correct network (Chain ID: ${targetChainId})`);
      } else {
        setNetworkError(null);
      }

      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
      
      const signer = await provider.getSigner();
      setSigner(signer);
      setProvider(provider);

      initContracts(provider, signer);
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  }, []);

  const initContracts = useCallback(async (provider, signer) => {
    try {
      const factory = new ethers.Contract(
        import.meta.env.VITE_FACTORY_ADDRESS,
        EscrowFactoryABI,
        signer
      );

      const usdc = new ethers.Contract(
        import.meta.env.VITE_MOCKUSDC_ADDRESS,
        MockUSDCABI,
        signer
      );

      const pool = new ethers.Contract(
        import.meta.env.VITE_MOCKAUTOPOOL_ADDRESS,
        MockAutoPoolABI,
        signer
      );

      setContracts({
        factory,
        usdc,
        pool
      });
    } catch (error) {
      console.error('Error initializing contracts:', error);
    }
  }, []);

  // Create a contract instance for a vault
  const getVaultContract = useCallback((vaultAddress) => {
    if (!signer || !vaultAddress) return null;
    
    return new ethers.Contract(
      vaultAddress,
      EscrowVaultABI,
      signer
    );
  }, [signer]);

  useEffect(() => {
    // Handle account changes
    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        setAccount(null);
        setSigner(null);
      } else if (accounts[0] !== account) {
        setAccount(accounts[0]);
        connectWallet(); // Reconnect with the new account
      }
    };

    // Handle chain changes
    const handleChainChanged = () => {
      window.location.reload();
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [account, connectWallet]);

  const value = {
    account,
    chainId,
    provider,
    signer,
    contracts,
    connectWallet,
    networkError,
    getVaultContract,
  };

  return (
    <BlockchainContext.Provider value={value}>
      {children}
    </BlockchainContext.Provider>
  );
};