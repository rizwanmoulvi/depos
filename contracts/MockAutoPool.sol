// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockAutoPool is ERC20, Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;
    uint8 private constant USDC_DECIMALS = 6;
    uint256 public totalUnderlying;

    constructor(address _usdc)
        ERC20("Mock AutoPool Share", "mAP")
        Ownable(msg.sender) 
    {
        usdc = IERC20(_usdc);
    }

    function deposit(uint256 amount, address to) external returns (uint256 sharesMinted) {
        require(amount > 0, "zero amount");
        usdc.safeTransferFrom(msg.sender, address(this), amount);

        if (totalSupply() == 0 || totalUnderlying == 0) {
            sharesMinted = amount;
        } else {
            sharesMinted = (amount * totalSupply()) / totalUnderlying;
            require(sharesMinted > 0, "shares zero");
        }

        totalUnderlying += amount;
        _mint(to, sharesMinted);
    }

    function withdrawShares(uint256 shares, address to) external returns (uint256 underlyingAmount) {
        require(shares > 0, "shares zero");
        uint256 ts = totalSupply();
        require(ts > 0, "no supply");

        underlyingAmount = (shares * totalUnderlying) / ts;
        _burn(msg.sender, shares);
        totalUnderlying -= underlyingAmount;
        usdc.safeTransfer(to, underlyingAmount);
    }

    function accrue(uint256 amount) external onlyOwner {
        require(amount > 0, "zero");
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        totalUnderlying += amount;
    }

    function sharePrice() external view returns (uint256) {
        if (totalSupply() == 0) return 1e6;
        return (totalUnderlying * (10 ** USDC_DECIMALS)) / totalSupply();
    }
}
