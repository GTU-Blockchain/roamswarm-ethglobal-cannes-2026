// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title UserPOIRegistry
/// @notice Tracks which POIs each user has unlocked + city completion counts
contract UserPOIRegistry {
    mapping(address => mapping(bytes32 => bool)) public unlockedPOIs;
    mapping(address => bytes32[]) public userPOIList;
    mapping(bytes32 => bytes32[]) public cityPOIs; // cityId => poiIds

    address public owner;

    event POIUnlocked(address indexed user, bytes32 indexed poiId);

    constructor() { owner = msg.sender; }

    function recordUnlock(address user, bytes32 poiId) external {
        // TODO: implement — only callable by escrow / redeemer
    }

    function getUnlockedCount(address user, bytes32 cityId) external view returns (uint256) {
        // TODO: implement
        return 0;
    }

    function getUserPOICount(address user) external view returns (uint256) {
        return userPOIList[user].length;
    }
}
