// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "mUSDC") {
        // initial mint to deployer for convenience
        _mint(msg.sender, 1_000_000e6); // 1M
    }

    // helper: faucet for tests
    function faucet(address to, uint256 amount) external {
        _mint(to, amount);
    }

    // override decimals to 6 to match USDC
    function decimals() public pure override returns (uint8) {
        return 6;
    }
}
