# 🚀 Quick Fix for Vercel Deployment

## Problem 1: 404 on Refresh ✅ FIXED

**Solution:** Created `vercel.json` file

Already done! This file tells Vercel to route all requests to index.html.

---

## Problem 2: Connect Button Not Working 🔧

### Root Cause
Environment variables from `.env` file are **NOT** automatically used in Vercel.

### Fix Steps (Do This Now!)

#### 1. Go to Vercel Dashboard
1. Open your project in Vercel
2. Click **Settings** (top navigation)
3. Click **Environment Variables** (left sidebar)

#### 2. Add These 6 Variables

Copy-paste these exactly:

**Variable 1:**
- Name: `VITE_FACTORY_ADDRESS`
- Value: `0xd7443F291f4C95effD7eFE3588Af4D8338f676bE`

**Variable 2:**
- Name: `VITE_USDC_ADDRESS`
- Value: `0x0000000000000000000000000000000000001549`

**Variable 3:**
- Name: `VITE_LENDING_POOL_ADDRESS`
- Value: `0x7710a96b01e02eD00768C3b39BfA7B4f1c128c62`

**Variable 4:**
- Name: `VITE_ATOKEN_ADDRESS`
- Value: `0xee72C37fEc48C9FeC6bbD0982ecEb7d7a038841e`

**Variable 5:**
- Name: `VITE_NETWORK_RPC`
- Value: `https://testnet.hashio.io/api`

**Variable 6:**
- Name: `VITE_CHAIN_ID`
- Value: `296`

#### 3. Important Settings
For each variable, make sure:
- ✅ Check **Production**
- ✅ Check **Preview**
- ✅ Check **Development**

#### 4. Redeploy
After adding ALL 6 variables:
- Go to **Deployments** tab
- Click the **...** menu on latest deployment
- Click **Redeploy**

---

## 🧪 How to Test After Deployment

1. **Open your Vercel URL** (e.g., yourapp.vercel.app)

2. **Open Browser Console** (Press F12)

3. **Look for this message:**
   ```
   ✅ All environment variables loaded: { ... }
   ```

4. **If you see this instead:**
   ```
   ❌ Missing environment variables: [...]
   ```
   → Go back to step 2 and add the missing variables

5. **Test Connect Button:**
   - Click "Connect Wallet" in navbar
   - MetaMask popup should appear
   - If nothing happens, check console for errors

---

## 📋 Verification Checklist

After redeployment, test these:

- [ ] Go to `/landlord` and refresh → No 404
- [ ] Go to `/tenant` and refresh → No 404  
- [ ] Click "Connect Wallet" → MetaMask opens
- [ ] Console shows "✅ All environment variables loaded"
- [ ] Can see wallet address after connecting
- [ ] Can view dashboards

---

## 🐛 Common Errors & Solutions

### Error: "Cannot read properties of undefined"
**Solution:** Missing environment variables. Add them in Vercel dashboard.

### Error: Still getting 404 on refresh
**Solution:** 
1. Check `vercel.json` is in `/client` folder
2. Check Root Directory in Vercel settings is `client`

### Error: Connect button does nothing
**Solution:**
1. Open console - check for red errors
2. Verify all 6 environment variables are added
3. Make sure you redeployed after adding variables

---

## 🎯 What We Changed

1. ✅ Created `vercel.json` for SPA routing
2. ✅ Added environment variable checker
3. ✅ Build successful locally

**Now you need to:**
- Add environment variables in Vercel
- Redeploy
- Test!

---

## 💡 Pro Tips

- Environment variables are injected at **build time**, not runtime
- Any change to env vars requires a **redeploy**
- Console messages will help you debug issues
- All contract addresses are public blockchain data (safe to expose)

---

**Next:** Add the 6 environment variables in Vercel and redeploy! 🚀
