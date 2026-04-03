// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IWorldID {
    function verifyProof(
        uint256 root,
        uint256 groupId,
        uint256 signalHash,
        uint256 nullifierHash,
        uint256 externalNullifierHash,
        uint256[8] calldata proof
    ) external view;
}

/// @title ContributorRegistry
/// @notice Stores World ID 4.0 verified contributors + their ENS subnames
contract ContributorRegistry {
    IWorldID public immutable worldId;
    uint256 public immutable groupId = 1; // Orb-verified
    uint256 public immutable externalNullifier;

    mapping(address => bool) public verified;
    mapping(address => string) public ensName;
    mapping(uint256 => bool) public nullifierUsed; // prevent double-registration

    event ContributorRegistered(address indexed contributor, string ensSubname);

    constructor(address _worldIdAddress, uint256 _externalNullifier) {
        worldId = IWorldID(_worldIdAddress);
        externalNullifier = _externalNullifier;
    }

    /// @notice Register as a verified contributor via World ID ZK proof
    /// @param signal       The user's wallet address (as uint256)
    /// @param root         The Merkle root of the World ID tree
    /// @param nullifierHash Unique hash preventing double-registration
    /// @param proof        The ZK proof
    /// @param ensSubname   Desired ENS subname (e.g. "alice")
    function register(
        address signal,
        uint256 root,
        uint256 nullifierHash,
        uint256[8] calldata proof,
        string calldata ensSubname
    ) external {
        require(!verified[msg.sender], "Already registered");
        require(!nullifierUsed[nullifierHash], "Proof already used");
        require(signal == msg.sender, "Signal mismatch");
        require(bytes(ensSubname).length > 0, "Empty subname");

        worldId.verifyProof(
            root,
            groupId,
            uint256(keccak256(abi.encodePacked(signal))),
            nullifierHash,
            externalNullifier,
            proof
        );

        nullifierUsed[nullifierHash] = true;
        verified[msg.sender] = true;
        ensName[msg.sender] = ensSubname;

        emit ContributorRegistered(msg.sender, ensSubname);
    }

    function isVerified(address contributor) external view returns (bool) {
        return verified[contributor];
    }
}
