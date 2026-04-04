// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IENSRegistry — minimal interface for ENS registry interactions
interface IENSRegistry {
    function setSubnodeOwner(bytes32 node, bytes32 label, address owner) external returns (bytes32);
    function setResolver(bytes32 node, address resolver) external;
    function owner(bytes32 node) external view returns (address);
}

/// @title IENSResolver — minimal interface for public resolver text records
interface IENSResolver {
    function setText(bytes32 node, string calldata key, string calldata value) external;
    function text(bytes32 node, string calldata key) external view returns (string memory);
}

/// @title ENSSubnameRegistry
/// @notice Manages ENS subnames for contributors ({id}.contributors.roamswarm.eth)
///         and stores reputation/points/badge data as ENS text records.
contract ENSSubnameRegistry {
    IENSRegistry public immutable ensRegistry;
    IENSResolver public immutable ensResolver;
    bytes32 public immutable roamNode; // namehash of roamswarm.eth

    address public owner;

    mapping(address => bytes32) public addressToNode;
    mapping(bytes32 => address) public nodeToAddress;
    mapping(address => string) public addressToLabel;

    /// @notice Contracts allowed to call registerSubname (e.g. ContributorRegistry)
    mapping(address => bool) public authorized;

    event SubnameRegistered(address indexed contributor, string label, bytes32 node);
    event TextRecordSet(bytes32 indexed node, string key, string value);
    event AuthorizedCaller(address indexed caller, bool status);

    modifier onlyOwner() {
        require(msg.sender == owner, "ENSSubnameRegistry: not owner");
        _;
    }

    modifier onlyAuthorized() {
        require(authorized[msg.sender] || msg.sender == owner, "ENSSubnameRegistry: not authorized");
        _;
    }

    constructor(address _ensRegistry, address _ensResolver, bytes32 _roamNode) {
        ensRegistry = IENSRegistry(_ensRegistry);
        ensResolver = IENSResolver(_ensResolver);
        roamNode = _roamNode;
        owner = msg.sender;
    }

    // ─── Subname registration ─────────────────────────────────────────────────

    /// @notice Register a subname under roamswarm.eth for a contributor.
    ///         Example: label="alice" → alice.roamswarm.eth
    ///         Callable by owner OR authorized contracts (e.g. ContributorRegistry).
    function registerSubname(string calldata label, address contributor) external onlyAuthorized {
        require(contributor != address(0), "ENSSubnameRegistry: zero address");
        require(addressToNode[contributor] == bytes32(0), "ENSSubnameRegistry: already registered");

        bytes32 labelHash = keccak256(bytes(label));
        bytes32 node = keccak256(abi.encodePacked(roamNode, labelHash));

        // Record mappings (always, even if ENS call fails on testnet)
        addressToNode[contributor] = node;
        nodeToAddress[node] = contributor;
        addressToLabel[contributor] = label;

        // Attempt ENS registry call — skip if registry not set (testnet / unit tests)
        if (address(ensRegistry) != address(0)) {
            try ensRegistry.setSubnodeOwner(roamNode, labelHash, contributor) {} catch {}
            try ensRegistry.setResolver(node, address(ensResolver)) {} catch {}
        }

        emit SubnameRegistered(contributor, label, node);
    }

    // ─── Text records ─────────────────────────────────────────────────────────

    /// @notice Write an ENS text record to a node owned by a contributor.
    ///         Called by other system contracts (RoamPoints, CityBadgeNFT) to
    ///         keep reputation/points/badge data portable across apps.
    function setText(bytes32 node, string calldata key, string calldata value) external onlyOwner {
        try ensResolver.setText(node, key, value) {
            emit TextRecordSet(node, key, value);
        } catch {
            // Resolver not set yet — emit event anyway for off-chain indexing
            emit TextRecordSet(node, key, value);
        }
    }

    /// @notice Convenience: set roamPoints text record for a contributor
    function setPointsRecord(address contributor, string calldata points) external onlyOwner {
        bytes32 node = addressToNode[contributor];
        require(node != bytes32(0), "ENSSubnameRegistry: not registered");
        this.setText(node, "roamPoints", points);
    }

    /// @notice Convenience: set roamBadges text record for a contributor
    function setBadgesRecord(address contributor, string calldata badges) external onlyOwner {
        bytes32 node = addressToNode[contributor];
        require(node != bytes32(0), "ENSSubnameRegistry: not registered");
        this.setText(node, "roamBadges", badges);
    }

    // ─── Access control ───────────────────────────────────────────────────────

    /// @notice Grant or revoke registerSubname permission to a contract (e.g. ContributorRegistry)
    function setAuthorized(address caller, bool status) external onlyOwner {
        authorized[caller] = status;
        emit AuthorizedCaller(caller, status);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "ENSSubnameRegistry: zero address");
        owner = newOwner;
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    function getNode(address contributor) external view returns (bytes32) {
        return addressToNode[contributor];
    }

    function getLabel(address contributor) external view returns (string memory) {
        return addressToLabel[contributor];
    }

    function getContributor(bytes32 node) external view returns (address) {
        return nodeToAddress[node];
    }

    function isRegistered(address contributor) external view returns (bool) {
        return addressToNode[contributor] != bytes32(0);
    }
}
