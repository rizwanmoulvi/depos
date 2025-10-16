// Environment Configuration Check
// This helps verify environment variables are loaded correctly

export const checkEnvConfig = () => {
  const requiredVars = [
    'VITE_FACTORY_ADDRESS',
    'VITE_USDC_ADDRESS',
    'VITE_LENDING_POOL_ADDRESS',
    'VITE_ATOKEN_ADDRESS',
    'VITE_NETWORK_RPC',
    'VITE_CHAIN_ID'
  ];

  const missing = [];
  const config = {};

  requiredVars.forEach(varName => {
    const value = import.meta.env[varName];
    if (!value) {
      missing.push(varName);
    }
    config[varName] = value || 'MISSING';
  });

  if (missing.length > 0) {
    console.error('❌ Missing environment variables:', missing);
    console.error('Please add these to your Vercel dashboard under Settings → Environment Variables');
    return false;
  }

  console.log('✅ All environment variables loaded:', config);
  return true;
};

export default checkEnvConfig;
