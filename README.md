# Depos - Bonzo Finance Integration

This repository contains the contracts and client application for integrating with Bonzo Finance on Hedera Testnet. The application allows users to create rental agreements where deposits are supplied to Bonzo Finance to earn yield.

## Key Components

### Smart Contracts

1. **EscrowFactory.sol**: Creates new escrow vaults for rental agreements
2. **EscrowVault.sol**: Manages deposit, supply to Bonzo Finance, and withdrawal

### Client Application

React application that provides a UI for:
- Creating rental agreements
- Depositing USDC into vaults
- Monitoring yield from Bonzo Finance
- Settling agreements after the rental period

## How to Deploy

### 1. Deploy Contracts

Deploy the contracts to Hedera Testnet:

```
cd contracts
# Deploy using your preferred method (Remix, Hardhat, etc.)
```

Parameters for EscrowFactory constructor:
- `_usdc`: Bonzo Finance USDC token address (0x0000000000000000000000000000000000001549)
- `_lendingPool`: Bonzo Finance lending pool address (0x7710a96b01e02eD00768C3b39BfA7B4f1c128c62)
- `_aToken`: Bonzo Finance aUSDC token address (0xee72C37fEc48C9FeC6bbD0982ecEb7d7a038841e)
- `_treasury`: Your treasury address for collecting fees

### 2. Set Up Client

```
cd client
npm install
```

Create an `.env` file with the following:

```
VITE_CHAIN_ID=296
VITE_FACTORY_ADDRESS=0xd7443F291f4C95effD7eFE3588Af4D8338f676bE
VITE_USDC_ADDRESS=0x0000000000000000000000000000000000001549
VITE_LENDING_POOL_ADDRESS=0x7710a96b01e02eD00768C3b39BfA7B4f1c128c62
VITE_ATOKEN_ADDRESS=0xee72C37fEc48C9FeC6bbD0982ecEb7d7a038841e
VITE_NETWORK_RPC=https://testnet.hashio.io/api
```

### 3. Run the Client

```
npm run dev
```

## Using the Supply Scripts

The supply-scripts directory contains scripts for directly interacting with Bonzo Finance:

```bash
# Deposit USDC to Bonzo Finance
node index.js deposit USDC 2

# Withdraw USDC from Bonzo Finance
node index.js withdraw USDC 5
```

### Environment Setup for Scripts

Create a `.env` file in the supply-scripts directory:

```
PRIVATE_KEY_TESTNET=your_private_key
ACCOUNT_ID_TESTNET=your_account_id
CHAIN_TYPE=hedera_testnet
```

## Contract Functionality

### EscrowVault

1. **depositAndSupply()**: Tenant deposits USDC into the vault and it's supplied to Bonzo Finance
2. **settle()**: After the rental period, withdraws funds from Bonzo Finance, returns principal to tenant, and distributes yield between landlord and treasury
3. **emergencyWithdrawTo()**: Factory owner can withdraw in case of emergency

### EscrowFactory

Creates new vaults with proper parameters for landlords and tenants.

## Bonzo Finance Integration

This application integrates with Bonzo Finance on Hedera Testnet, using:

- USDC Token: 0x0000000000000000000000000000000000001549
- Lending Pool: 0x7710a96b01e02eD00768C3b39BfA7B4f1c128c62
- aUSDC Token: 0xee72C37fEc48C9FeC6bbD0982ecEb7d7a038841e

The yield generated comes from Bonzo Finance's lending activities, where borrowers pay interest that accrues to suppliers (like our EscrowVault contracts).