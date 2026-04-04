// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title UserPOIRegistry
/// @notice Tracks which POIs each user has unlocked + city completion counts
contract UserPOIRegistry {
    mapping(address => mapping(bytes32 => bool)) public unlockedPOIs;
    mapping(address => bytes32[]) public userPOIList;
    mapping(bytes32 => bytes32[]) public cityPOIs; // cityId => poiIds

    address public owner;
    mapping(address => bool) public authorized; // escrow + redeemer

    event POIUnlocked(address indexed user, bytes32 indexed poiId);
    event AuthorizedCaller(address indexed caller, bool status);

    modifier onlyAuthorized() {
        require(authorized[msg.sender] || msg.sender == owner, "Not authorized");
        _;
    }

    constructor() { owner = msg.sender; }

    function setAuthorized(address caller, bool status) external {
        require(msg.sender == owner, "Not owner");
        authorized[caller] = status;
        emit AuthorizedCaller(caller, status);
    }

    /// @notice Register a POI as belonging to a city (called by owner during setup)
    function addPOIToCity(bytes32 cityId, bytes32 poiId) external {
        require(msg.sender == owner, "Not owner");
        cityPOIs[cityId].push(poiId);
    }

    /// @notice Record a POI unlock for a user — callable only by escrow or redeemer
    function recordUnlock(address user, bytes32 poiId) external onlyAuthorized {
        if (!unlockedPOIs[user][poiId]) {
            unlockedPOIs[user][poiId] = true;
            userPOIList[user].push(poiId);
            emit POIUnlocked(user, poiId);
        }
    }

    /// @notice Count how many POIs in a city the user has unlocked
    function getUnlockedCount(address user, bytes32 cityId) external view returns (uint256 count) {
        bytes32[] storage pois = cityPOIs[cityId];
        for (uint256 i = 0; i < pois.length; i++) {
            if (unlockedPOIs[user][pois[i]]) count++;
        }
    }

    function getUserPOICount(address user) external view returns (uint256) {
        return userPOIList[user].length;
    }

    function getCityPOIs(bytes32 cityId) external view returns (bytes32[] memory) {
        return cityPOIs[cityId];
    }
}
