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

interface IENSSubnameRegistry {
    function registerSubname(string calldata label, address contributor) external;
}

/// @title ContributorRegistry
/// @notice Stores World ID 4.0 verified contributors + their ENS subnames.
contract ContributorRegistry {
    IWorldID public immutable worldId;
    uint256 public immutable groupId = 1; // Orb-verified
    uint256 public immutable externalNullifier;

    /// @notice Optional: auto-grant ENS subname on register. Set after deploy.
    address public ensSubnameRegistry;
    address public owner;

    mapping(address => bool) public verified;
    mapping(address => string) public ensName;
    mapping(uint256 => bool) public nullifierUsed;

    event ContributorRegistered(address indexed contributor, string ensSubname);
    event ENSSubnameRegistrySet(address indexed registry);

    modifier onlyOwner() {
        require(msg.sender == owner, "ContributorRegistry: not owner");
        _;
    }

    constructor(address _worldIdAddress, uint256 _externalNullifier) {
        worldId = IWorldID(_worldIdAddress);
        externalNullifier = _externalNullifier;
        owner = msg.sender;
    }

    function setENSSubnameRegistry(address _registry) external onlyOwner {
        ensSubnameRegistry = _registry;
        emit ENSSubnameRegistrySet(_registry);
    }

    /// @notice Register as a verified contributor via World ID ZK proof.
    /// @param signal        Wallet address (must equal msg.sender)
    /// @param root          World ID Merkle root
    /// @param nullifierHash Unique nullifier — prevents double-registration
    /// @param proof         ZK proof from IDKit
    /// @param ensSubname    Desired ENS subname (e.g. "alice")
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

        // Signal hash: keccak256(abi.encodePacked(address)) >> 8
        // Matches IDKit: address "0x..." is Hex-validated → hashed as raw 20 bytes → >> 8
        uint256 signalHash = uint256(keccak256(abi.encodePacked(signal))) >> 8;

        worldId.verifyProof(
            root,
            groupId,
            signalHash,
            nullifierHash,
            externalNullifier,
            proof
        );

        nullifierUsed[nullifierHash] = true;
        verified[msg.sender] = true;
        ensName[msg.sender] = ensSubname;

        emit ContributorRegistered(msg.sender, ensSubname);

        if (ensSubnameRegistry != address(0)) {
            try IENSSubnameRegistry(ensSubnameRegistry).registerSubname(ensSubname, msg.sender) {}
            catch {}
        }
    }

    function isVerified(address contributor) external view returns (bool) {
        return verified[contributor];
    }
}
