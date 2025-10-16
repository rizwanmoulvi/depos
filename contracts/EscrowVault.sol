// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IBonzoLendingPool {
    function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external payable;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
}

interface IAToken {
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

contract EscrowVault is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Fee basis points (20% = 2000 bps)
    uint16 public constant FEE_BPS = 2000;
    uint16 public constant REFERRAL_CODE = 0;

    // Important addresses / state
    address public factory;
    address public landlord;
    address public tenant;
    IERC20 public usdc;
    IBonzoLendingPool public lendingPool;
    IAToken public aToken;
    address public treasury;

    uint256 public depositAmount;
    uint256 public startTs;
    uint256 public endTs;

    bytes32 public propertyName;
    bytes32 public propertyLocation;

    bool public deposited;
    bool public settled;
    uint256 public initialDeposit;

    // Monthly rent feature
    uint256 public monthlyRent;
    mapping(uint256 => bool) public rentPaidForMonth; // month index => paid status
    uint256 public totalRentPaid;

    event Deposited(address indexed tenant, uint256 amount);
    event Settled(uint256 principal, uint256 yieldAmount, uint256 fee);
    event RentPaid(address indexed tenant, uint256 month, uint256 amount, uint256 timestamp);

    modifier onlyFactory() {
        require(msg.sender == factory, "only factory");
        _;
    }

    modifier onlyLandlord() {
        require(msg.sender == landlord, "only landlord");
        _;
    }

    // Set factory to deployer (the EscrowFactory contract)
    constructor() {
        factory = msg.sender;
    }

    // Struct to avoid passing many parameters on the stack
    struct InitParams {
        address factory;
        address landlord;
        address tenant;
        address usdc;
        address lendingPool;
        address aToken;
        address treasury;
        uint256 depositAmount;
        uint256 monthlyRent;
        uint256 startTs;
        uint256 endTs;
        bytes32 propertyName;
        bytes32 propertyLocation;
    }

    // Initialize vault (callable only by factory that deployed this vault)
    function init(InitParams calldata params) external onlyFactory {
        // Basic one-time init check: ensure landlord is not already set
        require(landlord == address(0), "already init");

        // assign fields (note: factory was set in constructor, but we store it too)
        factory = params.factory; // optional, keeps explicit field
        landlord = params.landlord;
        tenant = params.tenant;
        usdc = IERC20(params.usdc);
        lendingPool = IBonzoLendingPool(params.lendingPool);
        aToken = IAToken(params.aToken);
        treasury = params.treasury;
        depositAmount = params.depositAmount;
        monthlyRent = params.monthlyRent;
        startTs = params.startTs;
        endTs = params.endTs;
        propertyName = params.propertyName;
        propertyLocation = params.propertyLocation;
    }

    function depositAndSupply() external nonReentrant {
        require(!deposited, "already deposited");
        require(msg.sender == tenant, "only tenant");

        // Transfer deposit from tenant
        usdc.safeTransferFrom(tenant, address(this), depositAmount);

        // Approve lending pool (use safeIncreaseAllowance)
        usdc.safeIncreaseAllowance(address(lendingPool), depositAmount);

        // Deposit to lending pool
        lendingPool.deposit(address(usdc), depositAmount, address(this), REFERRAL_CODE);

        initialDeposit = depositAmount;
        deposited = true;

        emit Deposited(tenant, depositAmount);
    }

    function settle() external onlyLandlord nonReentrant {
        require(deposited, "not deposited");
        require(!settled, "already settled");
        require(block.timestamp >= endTs, "not mature");

        // Get current aToken balance (principal + yield)
        uint256 aTokenBalance = aToken.balanceOf(address(this));

        // Withdraw everything from lending pool (this may convert to underlying)
        lendingPool.withdraw(address(usdc), aTokenBalance, address(this));

        uint256 principal = depositAmount;
        uint256 total = usdc.balanceOf(address(this));
        uint256 yieldAmount = (total > principal) ? (total - principal) : 0;

        uint256 fee = (yieldAmount * FEE_BPS) / 10000;
        uint256 landlordShare = (yieldAmount > fee) ? (yieldAmount - fee) : 0;

        // Return principal to tenant
        usdc.safeTransfer(tenant, principal);

        // Transfer landlord share of yield
        if (landlordShare > 0) {
            usdc.safeTransfer(landlord, landlordShare);
        }

        // Transfer fee to treasury
        if (fee > 0) {
            usdc.safeTransfer(treasury, fee);
        }

        settled = true;
        emit Settled(principal, yieldAmount, fee);
    }

    // Pay monthly rent - tenant can pay any month that hasn't been paid yet
    function payRent(uint256 monthIndex) external nonReentrant {
        require(msg.sender == tenant, "only tenant");
        require(monthlyRent > 0, "no rent configured");
        require(!rentPaidForMonth[monthIndex], "rent already paid for this month");
        
        // Calculate if the month is valid (between start and end date)
        uint256 totalMonths = (endTs - startTs) / 30 days;
        
        require(monthIndex <= totalMonths, "month index out of range");
        
        // Transfer rent from tenant to landlord
        usdc.safeTransferFrom(tenant, landlord, monthlyRent);
        
        // Mark as paid
        rentPaidForMonth[monthIndex] = true;
        totalRentPaid += monthlyRent;
        
        emit RentPaid(tenant, monthIndex, monthlyRent, block.timestamp);
    }

    // Get current month index
    function getCurrentMonthIndex() external view returns (uint256) {
        if (block.timestamp < startTs) return 0;
        return (block.timestamp - startTs) / 30 days;
    }

    // Check if rent is paid for a specific month
    function isRentPaidForMonth(uint256 monthIndex) external view returns (bool) {
        return rentPaidForMonth[monthIndex];
    }

    // Emergency withdraw by factory (admin)
    function emergencyWithdrawTo(address to) external onlyFactory nonReentrant {
        uint256 aTokenBalance = aToken.balanceOf(address(this));

        if (aTokenBalance > 0) {
            lendingPool.withdraw(address(usdc), aTokenBalance, address(this));
        }

        uint256 bal = usdc.balanceOf(address(this));
        if (bal > 0) {
            usdc.safeTransfer(to, bal);
        }
    }
}
