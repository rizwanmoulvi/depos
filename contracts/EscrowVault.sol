// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IAutoPool {
    function deposit(uint256 amount, address to) external returns (uint256);
    function withdrawShares(uint256 shares, address to) external returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function totalSupply() external view returns (uint256);
    function sharePrice() external view returns (uint256);
}

contract EscrowVault is ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint16 public constant FEE_BPS = 2000; // 20% fee

    address public factory;
    address public landlord;
    address public tenant;
    IERC20 public usdc;
    IAutoPool public pool;
    address public treasury;

    uint256 public depositAmount;
    uint256 public startTs;
    uint256 public endTs;

    bytes32 public propertyName;
    bytes32 public propertyLocation;

    bool public deposited;
    bool public settled;
    uint256 public poolShares;

    event Deposited(address indexed tenant, uint256 amount, uint256 shares);
    event Settled(uint256 principal, uint256 yieldAmount, uint256 fee);

    modifier onlyFactory() {
        require(msg.sender == factory, "only factory");
        _;
    }

    modifier onlyLandlord() {
        require(msg.sender == landlord, "only landlord");
        _;
    }

    constructor() {
        factory = msg.sender;
    }

    function init(
        address _factory,
        address _landlord,
        address _tenant,
        address _usdc,
        address _pool,
        address _treasury,
        uint256 _depositAmount,
        uint256 _startTs,
        uint256 _endTs,
        bytes32 _propertyName,
        bytes32 _propertyLocation
    ) external {
        require(factory == msg.sender || factory == address(0), "already init");

        factory = _factory;
        landlord = _landlord;
        tenant = _tenant;
        usdc = IERC20(_usdc);
        pool = IAutoPool(_pool);
        treasury = _treasury;
        depositAmount = _depositAmount;
        startTs = _startTs;
        endTs = _endTs;

        propertyName = _propertyName;
        propertyLocation = _propertyLocation;
    }

    function depositAndSupply() external nonReentrant {
        require(!deposited, "already deposited");
        require(msg.sender == tenant, "only tenant");

        usdc.safeTransferFrom(tenant, address(this), depositAmount);
        usdc.safeIncreaseAllowance(address(pool), depositAmount);

        uint256 shares = pool.deposit(depositAmount, address(this));
        poolShares = shares;
        deposited = true;

        emit Deposited(tenant, depositAmount, shares);
    }

    function settle() external onlyLandlord nonReentrant {
        require(deposited, "not deposited");
        require(!settled, "already settled");
        require(block.timestamp >= endTs, "not mature");

        uint256 withdrawn = pool.withdrawShares(poolShares, address(this));

        uint256 principal = depositAmount;
        uint256 total = withdrawn;
        uint256 yieldAmount = (total > principal) ? (total - principal) : 0;

        uint256 fee = (yieldAmount * FEE_BPS) / 10000;
        uint256 landlordShare = (yieldAmount > fee) ? (yieldAmount - fee) : 0;

        usdc.safeTransfer(tenant, principal);

        if (landlordShare > 0) {
            usdc.safeTransfer(landlord, landlordShare);
        }

        if (fee > 0) {
            usdc.safeTransfer(treasury, fee);
        }

        settled = true;
        emit Settled(principal, yieldAmount, fee);
    }

    function emergencyWithdrawTo(address to) external onlyFactory nonReentrant {
        uint256 shares = pool.balanceOf(address(this));
        if (shares > 0) {
            pool.withdrawShares(shares, address(this));
        }

        uint256 bal = usdc.balanceOf(address(this));
        if (bal > 0) {
            usdc.safeTransfer(to, bal);
        }
    }
}
