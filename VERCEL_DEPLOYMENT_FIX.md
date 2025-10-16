# Vercel Deployment Fix Guide 🚀

## Issues Identified

1. ✅ **404 on Refresh** - Fixed with `vercel.json`
2. 🔧 **Connect Button Not Working** - Environment variables issue

---

## ✅ Fixed: 404 on Refresh

Created `vercel.json` with SPA routing configuration:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This ensures all routes are handled by your React Router.

---

## 🔧 Fix: Connect Button Not Working

### Root Cause
Environment variables are **NOT automatically loaded** in Vercel from your `.env` file.

### Solution Steps

#### 1. Add Environment Variables in Vercel Dashboard

Go to your Vercel project → **Settings** → **Environment Variables**

Add these variables:

| Name | Value |
|------|-------|
| `VITE_FACTORY_ADDRESS` | `0xd7443F291f4C95effD7eFE3588Af4D8338f676bE` |
| `VITE_USDC_ADDRESS` | `0x0000000000000000000000000000000000001549` |
| `VITE_LENDING_POOL_ADDRESS` | `0x7710a96b01e02eD00768C3b39BfA7B4f1c128c62` |
| `VITE_ATOKEN_ADDRESS` | `0xee72C37fEc48C9FeC6bbD0982ecEb7d7a038841e` |
| `VITE_NETWORK_RPC` | `https://testnet.hashio.io/api` |
| `VITE_CHAIN_ID` | `296` |

**Important:** Set these for **Production**, **Preview**, and **Development** environments.

#### 2. Redeploy

After adding environment variables:
- Go to **Deployments** tab
- Click the three dots on your latest deployment
- Click **Redeploy**

OR

- Push a new commit to trigger automatic deployment

---

## 🔍 Verify Environment Variables

Once deployed, open browser console on your Vercel site and check:

```javascript
// Should see contract addresses
console.log({
  factory: import.meta.env.VITE_FACTORY_ADDRESS,
  usdc: import.meta.env.VITE_USDC_ADDRESS,
  lendingPool: import.meta.env.VITE_LENDING_POOL_ADDRESS
});
```

If these show `undefined`, the environment variables aren't set correctly.

---

## 📝 Checklist

### Before Deployment
- [x] Created `vercel.json` in `/client` folder
- [ ] Added all environment variables in Vercel dashboard
- [ ] Set variables for all environments (Production, Preview, Development)

### After Deployment
- [ ] Test refresh on different routes (e.g., `/landlord`, `/tenant`)
- [ ] Check browser console for errors
- [ ] Try connecting wallet
- [ ] Verify contract addresses are loaded (check console logs)

---

## 🐛 Debugging Steps

### If Connect Button Still Doesn't Work:

1. **Open Browser Console** (F12)
2. **Look for errors** when clicking Connect
3. **Check these logs:**
   ```
   Initializing contracts with addresses: { factory: '0x...', ... }
   ```
   
   If you see `undefined` values, environment variables are missing.

4. **Common Errors:**
   - `Cannot read properties of undefined` → Env vars not set
   - `MetaMask not found` → User needs MetaMask installed
   - `Wrong network` → User on wrong chain (should be 296)

### If 404 Still Happens:

1. **Verify `vercel.json` is in the correct location:**
   - Should be at `/client/vercel.json`
   - Same level as `package.json`

2. **Check Vercel build settings:**
   - Root Directory: `client`
   - Build Command: `npm run build`
   - Output Directory: `dist`

---

## 🚀 Quick Fix Commands

### 1. Commit vercel.json
```bash
cd /Users/rizwan/Documents/Projects/Depos-hedera/client
git add vercel.json
git commit -m "Add Vercel SPA routing configuration"
git push
```

### 2. Verify Local Build Works
```bash
npm run build
npm run preview  # Test production build locally
```

---

## 📋 Vercel Project Settings

Ensure these are set correctly:

**Framework Preset:** Vite

**Build & Development Settings:**
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`
- Development Command: `npm run dev`

**Root Directory:** `client` (if your repo has multiple folders)

---

## 🎯 Expected Behavior After Fix

1. ✅ Navigate to any route (e.g., `yoursite.vercel.app/landlord`)
2. ✅ Refresh page → Should stay on same route (no 404)
3. ✅ Click "Connect Wallet" → MetaMask popup appears
4. ✅ After connecting → Can see landlord/tenant dashboards
5. ✅ Can create agreements and interact with contracts

---

## 🔐 Security Note

Environment variables in Vercel:
- ✅ Are **injected at build time** for Vite (VITE_ prefix)
- ✅ Are **safe to use** for contract addresses and RPC URLs
- ⚠️ **Never store** private keys or secrets
- ✅ Public blockchain addresses are safe

---

## 📞 Still Having Issues?

Check browser console for:

1. **Network errors:**
   ```
   Failed to fetch from https://testnet.hashio.io/api
   ```
   → RPC URL might be down or CORS issue

2. **Contract initialization errors:**
   ```
   Error initializing contracts
   ```
   → Environment variables missing

3. **MetaMask errors:**
   ```
   User rejected the request
   ```
   → User cancelled connection

---

## ✅ Success Indicators

When everything works:

1. Console shows:
   ```
   Initializing contracts with addresses: {
     factory: '0xd7443F291f4C95effD7eFE3588Af4D8338f676bE',
     usdc: '0x0000000000000000000000000000000000001549',
     lendingPool: '0x7710a96b01e02eD00768C3b39BfA7B4f1c128c62'
   }
   ```

2. No 404 errors on refresh

3. Connect button triggers MetaMask

4. Can see wallet address in navbar after connecting

---

**Next Steps:**
1. Add environment variables in Vercel dashboard
2. Redeploy
3. Test the deployment
4. Let me know if you see any errors!
