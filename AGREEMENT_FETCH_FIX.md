# Agreement Fetching Fix - Debug Guide

## Changes Made

### 1. Fixed useEffect Dependencies
**Problem**: The dashboards were using `contracts.factory` and `account` directly in the dependency array, which could cause infinite re-renders since these are object references that change on every render.

**Solution**: Wrapped `loadVaults` in `useCallback` with proper dependencies, then used `loadVaults` itself in the useEffect dependency array.

### 2. Added Console Logging
Added extensive console.log statements in LandlordDashboard to debug:
- Whether dependencies are available
- The nextId from the factory
- Each vault address being checked
- Landlord comparison logic
- Final vault list

### 3. Added Refresh Mechanism
- LandlordDashboard now uses `forwardRef` and `useImperativeHandle`
- Parent component (LandlordPage) can call `refresh()` on the dashboard
- CreateAgreementForm now properly triggers refresh after creating agreement

## How to Debug

### Step 1: Open Browser Console
When you navigate to `/landlord` or `/tenant`, check the browser console for:

```javascript
// Should see these logs:
"Missing dependencies:" { hasFactory: true, hasAccount: true, hasGetVaultContract: true }
"Next vault ID:" "2"  // or whatever the current count is
"Vault 1 address:" "0x..."
"Vault 1 - Landlord: 0x..., Account: 0x..., Match: true/false"
"Found vaults for landlord:" [...]
```

### Step 2: Check What's Missing

**If you see "Missing dependencies":**
- `hasFactory: false` → Factory contract not initialized
- `hasAccount: false` → Wallet not connected
- `hasGetVaultContract: false` → Context function not available

**If "Next vault ID" shows "1":**
- No vaults have been created yet
- Create an agreement first from the "Create New" tab

**If vault addresses are shown but no matches:**
- Check the landlord/tenant addresses in the console
- Verify your wallet address matches
- Account addresses are case-insensitive but must match

### Step 3: Test the Flow

1. **Connect Wallet** (top right button)
2. **Go to Landlord Dashboard** → `/landlord`
3. **Switch to "Create New" tab**
4. **Fill in agreement details:**
   - Use your wallet address for "Landlord Address"
   - Use a different address for "Tenant Address"
   - Set dates in the future
5. **Click "Create Agreement"**
6. **Wait for transaction to complete**
7. **Should auto-switch to "My Agreements" tab and show the vault**

### Step 4: Check Tenant View

1. **Go to Tenant Dashboard** → `/tenant`
2. **Should see agreements where you're the tenant**
3. **If empty, create an agreement where you're the tenant**

## Common Issues

### Issue 1: Empty Dashboard Despite Creating Agreements
**Symptoms**: Created agreements but dashboard shows "No Agreements Yet"

**Debug Steps**:
1. Check console for "Next vault ID" - should be > 1
2. Check "Vault X address" logs - should show actual addresses, not 0x000...
3. Check landlord comparison - "Match: true" should appear for your vaults
4. Verify wallet address matches what you used in the form

**Possible Causes**:
- Used wrong address when creating agreement
- Wallet switched after creating
- Contract not properly deployed
- Factory pointing to wrong vault addresses

### Issue 2: Wallet Not Connected
**Symptoms**: Dashboard shows "Wallet Not Connected" message

**Solution**:
1. Click "Connect Wallet" in navbar
2. Approve MetaMask/wallet connection
3. Ensure you're on Hedera Testnet (Chain ID: 296)

### Issue 3: Contract Not Initialized
**Symptoms**: Console shows `hasFactory: false`

**Debug Steps**:
1. Check `.env` file has all contract addresses:
```env
VITE_FACTORY_ADDRESS=0x...
VITE_USDC_ADDRESS=0x...
VITE_LENDING_POOL_ADDRESS=0x...
VITE_ATOKEN_ADDRESS=0x...
```

2. Verify BlockchainContext is properly initializing contracts
3. Check network connection (should be Hedera Testnet - Chain ID 296)

### Issue 4: getVaultContract Returns Null
**Symptoms**: Vaults show in logs but cards don't render

**Debug Steps**:
1. Check `EscrowVaultMinimal.json` exists in `src/abis/`
2. Verify ABI is valid JSON
3. Check provider is initialized in BlockchainContext

## Code Structure

```
LandlordPage
  ├─ State: activeTab ('dashboard' | 'create')
  ├─ Ref: dashboardRef (for calling refresh)
  │
  ├─ Tab: My Agreements
  │   └─ LandlordDashboard (with ref)
  │       ├─ useCallback: loadVaults()
  │       ├─ useEffect: calls loadVaults when deps change
  │       ├─ useImperativeHandle: exposes refresh()
  │       └─ Maps vaults to VaultCard components
  │
  └─ Tab: Create New
      └─ CreateAgreementForm
          └─ onAgreementCreated → switches tab & calls refresh()
```

## Environment Check

Run this in browser console on the app:
```javascript
// Check if contracts are loaded
console.log('Factory:', window.ethereum ? 'Wallet available' : 'No wallet');

// Check environment variables (won't show values for security)
console.log('Has VITE_FACTORY_ADDRESS:', !!import.meta.env.VITE_FACTORY_ADDRESS);
console.log('Has VITE_USDC_ADDRESS:', !!import.meta.env.VITE_USDC_ADDRESS);
```

## Next Steps

If agreements still don't appear after following this guide:

1. **Share Console Output**: Copy all console logs and share them
2. **Check Transaction Hash**: After creating agreement, verify on Hedera explorer
3. **Verify Factory Address**: Ensure factory contract is correctly deployed
4. **Test Direct Contract Call**: Use ethers.js in console to call factory.nextId() directly

## Quick Test Script

Run this in browser console when on `/landlord` page:
```javascript
// This should trigger a manual refresh
const loadVaultsManually = async () => {
  const factory = /* get factory contract from context */;
  const account = /* get account from wallet */;
  
  const nextId = await factory.nextId();
  console.log('Total vaults:', nextId.toString());
  
  for (let i = 1; i < Number(nextId); i++) {
    const addr = await factory.vaults(i);
    console.log(`Vault ${i}:`, addr);
  }
};
```

---

**Status**: ✅ Build Successful  
**Changes**: Added debugging, fixed dependencies, added refresh mechanism  
**Action Required**: Start dev server and check browser console for logs
