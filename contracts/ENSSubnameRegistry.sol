// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ENSSubnameRegistry
/// @notice Manages ENS subnames: {id}.contributors.roam.eth, history.roam.eth, etc.
contract ENSSubnameRegistry {
    address public ensRegistry;
    bytes32 public roamNode;

    mapping(address => bytes32) public addressToNode;
    mapping(bytes32 => address) public nodeToAddress;

    event SubnameRegistered(address indexed contributor, string label, bytes32 node);

    constructor(address _ensRegistry, bytes32 _roamNode) {
        ensRegistry = _ensRegistry;
        roamNode = _roamNode;
    }

    function registerSubname(string calldata label, address contributor) external {
        // TODO: implement — set owner + resolver in ENS registry
        bytes32 node = keccak256(abi.encodePacked(roamNode, keccak256(bytes(label))));
        addressToNode[contributor] = node;
        nodeToAddress[node] = contributor;
        emit SubnameRegistered(contributor, label, node);
    }
}
