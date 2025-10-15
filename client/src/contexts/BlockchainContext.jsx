import { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { ethers } from 'ethers';

// ABIs
import EscrowFactoryABI from '../abis/EscrowFactory.json';
import EscrowVaultABI from '../abis/EscrowVaultMinimal.json';
import ERC20ABI from '../abis/ERC20.json';

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
    lendingPool: null
  });
  const [networkError, setNetworkError] = useState(null);
  const [isAutoConnecting, setIsAutoConnecting] = useState(true);
  
  // Cache for vault data to prevent excessive fetching
  const [vaultsCache, setVaultsCache] = useState({
    data: [],
    lastFetched: null,
    isLoading: false
  });

  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setSigner(null);
    setProvider(null);
    localStorage.removeItem('walletConnected');
  }, []);

  const connectWallet = useCallback(async (isAutoConnect = false) => {
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask');
        return false;
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

      // If auto-connecting, use eth_accounts which doesn't trigger a popup
      // Otherwise use eth_requestAccounts which will prompt the user
      const method = isAutoConnect ? "eth_accounts" : "eth_requestAccounts";
      const accounts = await provider.send(method, []);
      
      // If no accounts, auto-connect failed (user not previously connected)
      if (accounts.length === 0) {
        if (isAutoConnect) {
          return false; // Auto-connect failed, don't show error
        }
        throw new Error("No accounts found. Please unlock MetaMask.");
      }

      const account = accounts[0];
      setAccount(account);
      
      const signer = await provider.getSigner();
      setSigner(signer);
      setProvider(provider);

      initContracts(provider, signer);
      
      // Save to localStorage to enable auto-connect
      localStorage.setItem('walletConnected', 'true');
      
      return true;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      if (!isAutoConnect) {
        alert(`Error connecting wallet: ${error.message}`);
      }
      return false;
    } finally {
      if (isAutoConnect) {
        setIsAutoConnecting(false);
      }
    }
  }, []);

  const initContracts = useCallback(async (provider, signer) => {
    try {
      console.log('Initializing contracts with addresses:', {
        factory: import.meta.env.VITE_FACTORY_ADDRESS,
        usdc: import.meta.env.VITE_USDC_ADDRESS,
        lendingPool: import.meta.env.VITE_LENDING_POOL_ADDRESS
      });

      const factory = new ethers.Contract(
        import.meta.env.VITE_FACTORY_ADDRESS,
        EscrowFactoryABI,
        signer
      );

      const usdc = new ethers.Contract(
        import.meta.env.VITE_USDC_ADDRESS,
        ERC20ABI,
        signer
      );

      const lendingPool = new ethers.Contract(
        import.meta.env.VITE_LENDING_POOL_ADDRESS,
        [
          "function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external payable",
          "function withdraw(address asset, uint256 amount, address to) external returns (uint256)"
        ],
        signer
      );

      console.log('Contracts initialized successfully:', { 
        factory: factory.target, 
        usdc: usdc.target,
        lendingPool: lendingPool.target
      });

      setContracts({
        factory,
        usdc,
        lendingPool
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

  // Fetch all vaults with caching (5 minute cache)
  const fetchAllVaults = useCallback(async (forceRefresh = false) => {
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();
    
    // Return cached data if available and not expired
    if (!forceRefresh && vaultsCache.lastFetched && (now - vaultsCache.lastFetched < CACHE_DURATION)) {
      console.log('Returning cached vault data');
      return vaultsCache.data;
    }
    
    // Don't fetch if already fetching
    if (vaultsCache.isLoading) {
      console.log('Vault fetch already in progress, waiting...');
      return vaultsCache.data;
    }
    
    if (!contracts.factory || !account || !getVaultContract) {
      console.log('Missing dependencies for vault fetch');
      return [];
    }
    
    try {
      setVaultsCache(prev => ({ ...prev, isLoading: true }));
      console.log('Fetching vaults from blockchain...');
      
      const nextId = await contracts.factory.nextId();
      const vaultList = [];
      
      for (let i = 1; i < Number(nextId); i++) {
        try {
          const vaultAddress = await contracts.factory.vaults(i);
          if (vaultAddress === '0x0000000000000000000000000000000000000000') continue;
          
          const vaultContract = getVaultContract(vaultAddress);
          if (!vaultContract) continue;
          
          const [landlord, tenant, depositAmount, startTs, endTs, deposited, settled, propertyName, propertyLocation] = await Promise.all([
            vaultContract.landlord(),
            vaultContract.tenant(),
            vaultContract.depositAmount(),
            vaultContract.startTs(),
            vaultContract.endTs(),
            vaultContract.deposited(),
            vaultContract.settled(),
            vaultContract.propertyName(),
            vaultContract.propertyLocation()
          ]);
          
          vaultList.push({
            id: i,
            address: vaultAddress,
            landlord,
            tenant,
            depositAmount,
            startTs,
            endTs,
            deposited,
            settled,
            propertyName,
            propertyLocation
          });
        } catch (error) {
          console.error(`Error loading vault ${i}:`, error);
        }
      }
      
      const cachedData = {
        data: vaultList,
        lastFetched: now,
        isLoading: false
      };
      
      setVaultsCache(cachedData);
      console.log(`Cached ${vaultList.length} vaults`);
      return vaultList;
    } catch (error) {
      console.error('Error fetching vaults:', error);
      setVaultsCache(prev => ({ ...prev, isLoading: false }));
      return [];
    }
  }, [contracts.factory, account, getVaultContract, vaultsCache.lastFetched, vaultsCache.isLoading, vaultsCache.data]);

  // Invalidate cache (call this after creating/updating vaults)
  const invalidateVaultsCache = useCallback(() => {
    console.log('Invalidating vaults cache');
    setVaultsCache({ data: [], lastFetched: null, isLoading: false });
  }, []);

  // Auto-connect on page load
  useEffect(() => {
    const attemptAutoConnect = async () => {
      if (localStorage.getItem('walletConnected') === 'true') {
        try {
          const success = await connectWallet(true); // true = auto-connect mode
          if (!success) {
            console.log("Auto-connect failed. User will need to connect manually.");
            localStorage.removeItem('walletConnected');
          }
        } catch (error) {
          console.error("Error during auto-connect:", error);
          localStorage.removeItem('walletConnected');
        }
      } else {
        setIsAutoConnecting(false);
      }
    };

    if (window.ethereum) {
      attemptAutoConnect();
    } else {
      setIsAutoConnecting(false);
    }
  }, [connectWallet]);

  useEffect(() => {
    // Handle account changes
    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else if (accounts[0] !== account) {
        setAccount(accounts[0]);
        connectWallet(true); // Reconnect with the new account
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
    connectWallet: (isAuto) => connectWallet(isAuto),
    disconnectWallet,
    networkError,
    getVaultContract,
    isAutoConnecting,
    fetchAllVaults,
    invalidateVaultsCache,
  };

  return (
    <BlockchainContext.Provider value={value}>
      {children}
    </BlockchainContext.Provider>
  );
};