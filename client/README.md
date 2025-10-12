# Escrow dApp

A frontend application to interact with the Escrow contracts on Hedera.

## Features

- Create escrow agreements between landlords and tenants
- Deposit USDC into the escrow vault
- Simulate yield in the AutoPool (owner only)
- Settle escrow agreements after maturity
- Get test USDC from a faucet

## Getting Started

### Prerequisites

- Node.js v16+ and npm
- MetaMask or another Ethereum wallet
- Access to Flow EVM testnet

### Installation

1. Clone this repository:
   ```bash
   git clone <repository-url>
   ```

2. Navigate to the client directory:
   ```bash
   cd Depos-hedera/client
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Configure the environment variables in `.env`:
   ```
   VITE_FACTORY_ADDRESS=0x123...abc
   VITE_MOCKUSDC_ADDRESS=0x456...def
   VITE_MOCKAUTOPOOL_ADDRESS=0x789...xyz
   VITE_NETWORK_RPC=https://testnet.flow.evm/rpc
   VITE_CHAIN_ID=53935
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

1. Connect your wallet to the Flow EVM testnet
2. Get test USDC using the faucet
3. Create a new escrow agreement
4. Deposit USDC into the vault (as the tenant)
5. Simulate yield (as the owner)
6. Settle the vault when it matures (as the landlord)

## ERC20 Approval Handling

This application automatically handles ERC20 token approvals before transactions that require them. Two custom React hooks manage this process:

1. `useTenantDeposit` - Handles the tenant's USDC approval and deposit flow in a single transaction.
2. `useOwnerAccrue` - Handles the pool owner's USDC approval and yield accrual in a single transaction.

These hooks prevent `ERC20InsufficientAllowance` errors by:
- Checking the current allowance before performing a transaction
- Automatically approving the required amount if necessary
- Only then proceeding with the main transaction (deposit or accrue)

This approach provides a seamless user experience without requiring separate approval transactions.

## Contract Addresses

- EscrowFactory: `VITE_FACTORY_ADDRESS`
- MockUSDC: `VITE_MOCKUSDC_ADDRESS`
- MockAutoPool: `VITE_MOCKAUTOPOOL_ADDRESS`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.