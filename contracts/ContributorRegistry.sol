// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ContributorRegistry
/// @notice Stores World ID 4.0 verified contributors + their ENS subnames
contract ContributorRegistry {
    mapping(address => bool) public verified;
    mapping(address => string) public ensName;

    address public worldIdAddress;

    event ContributorRegistered(address indexed contributor, string ensSubname);

    constructor(address _worldIdAddress) {
        worldIdAddress = _worldIdAddress;
    }

    function register(
        address signal,
        uint256 root,
        uint256 nullifierHash,
        uint256[8] calldata proof,
        string calldata ensSubname
    ) external {
        // TODO: call IWorldID(worldIdAddress).verifyProof(...)
        verified[msg.sender] = true;
        ensName[msg.sender] = ensSubname;
        emit ContributorRegistered(msg.sender, ensSubname);
    }

    function isVerified(address contributor) external view returns (bool) {
        return verified[contributor];
    }
}
