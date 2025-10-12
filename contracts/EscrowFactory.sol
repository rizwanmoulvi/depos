// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./EscrowVault.sol";

contract EscrowFactory {
    address public owner;
    address public usdc;
    address public pool;
    address public treasury;
    uint256 public nextId;

    mapping(uint256 => address) public vaults;

    event AgreementCreated(
        uint256 indexed id,
        address vault,
        address landlord,
        address tenant
    );

    constructor(address _usdc, address _pool, address _treasury) {
        owner = msg.sender;
        usdc = _usdc;
        pool = _pool;
        treasury = _treasury;
        nextId = 1;
    }

    // Converts string to bytes32 (truncates if longer than 32 bytes)
    function stringToBytes32(string memory source) internal pure returns (bytes32 result) {
        bytes memory temp = bytes(source);
        if (temp.length == 0) {
            return 0x0;
        }
        assembly {
            result := mload(add(source, 32))
        }
    }

    function createAgreement(
        address landlord,
        address tenant,
        uint256 depositAmount,
        uint256 startTs,
        uint256 endTs,
        string memory propertyNameStr,
        string memory propertyLocationStr
    ) external returns (address) {
        require(endTs > startTs, "invalid times");

        EscrowVault vault = new EscrowVault();

        // Convert strings to bytes32 inline to reduce stack variables
        vault.init(
            address(this),
            landlord,
            tenant,
            usdc,
            pool,
            treasury,
            depositAmount,
            startTs,
            endTs,
            stringToBytes32(propertyNameStr),
            stringToBytes32(propertyLocationStr)
        );

        uint256 id = nextId++;
        vaults[id] = address(vault);

        emit AgreementCreated(id, address(vault), landlord, tenant);

        return address(vault);
    }

    // Admin function to update treasury if desired
    function setTreasury(address _treasury) external {
        require(msg.sender == owner, "only owner");
        treasury = _treasury;
    }
}
