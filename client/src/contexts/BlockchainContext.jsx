import { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { ethers } from 'ethers';
import { checkEnvConfig } from '../utils/envCheck';
import { showError, showWarning, showSuccess, showInfo } from '../utils/toast';

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

  // Check environment variables on mount
  useEffect(() => {
    checkEnvConfig();
  }, []);

  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setSigner(null);
    setProvider(null);
    localStorage.removeItem('walletConnected');
  }, []);

  const connectWallet = useCallback(async (isAutoConnect = false) => {
    try {
      console.log('🔵 [connectWallet] Starting wallet connection...', { isAutoConnect });
      
      if (!window.ethereum) {
        console.error('❌ [connectWallet] MetaMask not found');
        showError('Please install MetaMask to continue');
        return false;
      }

      console.log('✅ [connectWallet] MetaMask detected, creating provider...');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      console.log('🌐 [connectWallet] Network detected:', { 
        chainId: network.chainId.toString(),
        name: network.name 
      });
      
      setChainId(network.chainId);
      
      // Check if correct network
      const targetChainId = import.meta.env.VITE_CHAIN_ID;
      console.log('🎯 [connectWallet] Target chain ID:', targetChainId);
      
      if (network.chainId.toString() !== targetChainId) {
        const errorMsg = `Please switch to the correct network (Chain ID: ${targetChainId})`;
        console.warn('⚠️ [connectWallet] Wrong network:', errorMsg);
        setNetworkError(errorMsg);
        
        // Don't prompt during auto-connect
        if (!isAutoConnect) {
          // Show custom toast
          showWarning(
            'Wrong Network Detected',
            'You are connected to the wrong network. Switch to Hedera Testnet to continue.'
          );
          
          // Wait a moment for the toast to be visible, then prompt network switch
          setTimeout(async () => {
            const userConfirmed = window.confirm(
              'You are connected to the wrong network.\n\n' +
              'Would you like to switch to Hedera Testnet now?\n\n' +
              `Current Network: Chain ID ${network.chainId}\n` +
              `Required Network: Hedera Testnet (Chain ID ${targetChainId})`
            );
            
            if (userConfirmed) {
              // Attempt to switch network inline
              try {
                const chainIdHex = `0x${parseInt(targetChainId).toString(16)}`;
                console.log('🔄 [connectWallet] Attempting to switch network...');
                
                await window.ethereum.request({
                  method: 'wallet_switchEthereumChain',
                  params: [{ chainId: chainIdHex }],
                });
                
                showSuccess('Network Switched!', 'Successfully connected to Hedera Testnet');
                // Reload to reinitialize with new network
                window.location.reload();
              } catch (switchError) {
                // Network not added, try to add it
                if (switchError.code === 4902) {
                  try {
                    const chainIdHex = `0x${parseInt(targetChainId).toString(16)}`;
                    const rpcUrl = import.meta.env.VITE_NETWORK_RPC || 'https://testnet.hashio.io/api';
                    
                    await window.ethereum.request({
                      method: 'wallet_addEthereumChain',
                      params: [{
                        chainId: chainIdHex,
                        chainName: 'Hedera Testnet',
                        nativeCurrency: {
                          name: 'HBAR',
                          symbol: 'HBAR',
                          decimals: 18,
                        },
                        rpcUrls: [rpcUrl],
                        blockExplorerUrls: ['https://hashscan.io/testnet'],
                      }],
                    });
                    
                    showSuccess('Network Added!', 'Hedera Testnet has been added to your wallet');
                    window.location.reload();
                  } catch (addError) {
                    console.error('Failed to add network:', addError);
                    showError('Failed to add network');
                  }
                } else if (switchError.code === 4001) {
                  showWarning('Network Switch Cancelled', 'Please manually switch to Hedera Testnet');
                } else {
                  showError('Failed to switch network');
                }
              }
            } else {
              showInfo('Network Switch Required', 'Please manually switch to Hedera Testnet in your wallet');
            }
          }, 500);
        }
      } else {
        console.log('✅ [connectWallet] Correct network');
        setNetworkError(null);
      }

      // If auto-connecting, use eth_accounts which doesn't trigger a popup
      // Otherwise use eth_requestAccounts which will prompt the user
      const method = isAutoConnect ? "eth_accounts" : "eth_requestAccounts";
      console.log(`🔑 [connectWallet] Requesting accounts using: ${method}`);
      
      const accounts = await provider.send(method, []);
      console.log('📋 [connectWallet] Accounts received:', accounts.length);
      
      // If no accounts, auto-connect failed (user not previously connected)
      if (accounts.length === 0) {
        if (isAutoConnect) {
          console.log('ℹ️ [connectWallet] Auto-connect failed (no accounts)');
          return false; // Auto-connect failed, don't show error
        }
        throw new Error("No accounts found. Please unlock MetaMask.");
      }

      const account = accounts[0];
      console.log('👤 [connectWallet] Account connected:', account);
      setAccount(account);
      
      const signer = await provider.getSigner();
      console.log('✍️ [connectWallet] Signer obtained');
      setSigner(signer);
      setProvider(provider);

      console.log('📜 [connectWallet] Initializing contracts...');
      initContracts(provider, signer);
      
      // Save to localStorage to enable auto-connect
      localStorage.setItem('walletConnected', 'true');
      console.log('💾 [connectWallet] Saved to localStorage');
      
      console.log('🎉 [connectWallet] Wallet connection successful!');
      return true;
    } catch (error) {
      console.error('❌ [connectWallet] Error:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      if (!isAutoConnect) {
        showError(error.message || 'Failed to connect wallet');
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

  const switchToHederaTestnet = useCallback(async () => {
    try {
      const targetChainId = import.meta.env.VITE_CHAIN_ID;
      const chainIdHex = `0x${parseInt(targetChainId).toString(16)}`;
      
      console.log('🔄 [switchNetwork] Attempting to switch to Hedera Testnet...', { chainIdHex });
      
      // Try to switch to the network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });
      
      console.log('✅ [switchNetwork] Successfully switched to Hedera Testnet');
      showSuccess('Network Switched!', 'Successfully connected to Hedera Testnet');
      
      // Reload wallet connection to update provider/signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      setChainId(network.chainId);
      setNetworkError(null);
      
      if (account) {
        const signer = await provider.getSigner();
        setSigner(signer);
        setProvider(provider);
        initContracts(provider, signer);
      }
      
      return true;
    } catch (error) {
      console.error('❌ [switchNetwork] Error:', error);
      
      // If network doesn't exist in wallet, try to add it
      if (error.code === 4902) {
        try {
          console.log('➕ [switchNetwork] Network not found, attempting to add...');
          
          const targetChainId = import.meta.env.VITE_CHAIN_ID;
          const chainIdHex = `0x${parseInt(targetChainId).toString(16)}`;
          const rpcUrl = import.meta.env.VITE_NETWORK_RPC || 'https://testnet.hashio.io/api';
          
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: chainIdHex,
              chainName: 'Hedera Testnet',
              nativeCurrency: {
                name: 'HBAR',
                symbol: 'HBAR',
                decimals: 18,
              },
              rpcUrls: [rpcUrl],
              blockExplorerUrls: ['https://hashscan.io/testnet'],
            }],
          });
          
          console.log('✅ [switchNetwork] Successfully added and switched to Hedera Testnet');
          showSuccess('Network Added!', 'Hedera Testnet has been added to your wallet');
          
          // Reload wallet connection
          const provider = new ethers.BrowserProvider(window.ethereum);
          const network = await provider.getNetwork();
          setChainId(network.chainId);
          setNetworkError(null);
          
          if (account) {
            const signer = await provider.getSigner();
            setSigner(signer);
            setProvider(provider);
            initContracts(provider, signer);
          }
          
          return true;
        } catch (addError) {
          console.error('❌ [switchNetwork] Failed to add network:', addError);
          showError('Failed to add network');
          return false;
        }
      } else if (error.code === 4001) {
        // User rejected the request
        console.log('⚠️ [switchNetwork] User rejected network switch');
        showWarning('Network Switch Cancelled', 'Please switch to Hedera Testnet to continue');
        return false;
      } else {
        showError('Failed to switch network');
        return false;
      }
    }
  }, [account, initContracts]);

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
    const handleChainChanged = async (chainIdHex) => {
      console.log('🔄 [chainChanged] Network changed to:', chainIdHex);
      const newChainId = parseInt(chainIdHex, 16);
      const targetChainId = import.meta.env.VITE_CHAIN_ID;
      
      if (newChainId.toString() !== targetChainId) {
        console.warn('⚠️ [chainChanged] Wrong network detected');
        setNetworkError(`Please switch to the correct network (Chain ID: ${targetChainId})`);
        
        // Show warning with option to switch
        setTimeout(async () => {
          const userConfirmed = window.confirm(
            'You have switched to a different network.\n\n' +
            'Would you like to switch back to Hedera Testnet?\n\n' +
            `Current Network: Chain ID ${newChainId}\n` +
            `Required Network: Hedera Testnet (Chain ID ${targetChainId})`
          );
          
          if (userConfirmed && switchToHederaTestnet) {
            await switchToHederaTestnet();
          }
        }, 500);
      } else {
        console.log('✅ [chainChanged] Correct network');
        setNetworkError(null);
        showSuccess('Network Changed', 'Successfully connected to Hedera Testnet');
        // Reload to reinitialize contracts with new network
        window.location.reload();
      }
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
    switchToHederaTestnet,
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