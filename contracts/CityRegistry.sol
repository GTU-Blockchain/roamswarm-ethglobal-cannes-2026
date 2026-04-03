// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title CityRegistry
/// @notice Defines each city and its total POI count
contract CityRegistry {
    struct City {
        string name;
        uint256 totalPOIs;
        string badgeImageURI;
        bool active;
    }

    mapping(bytes32 => City) public cities;
    address public owner;

    event CityAdded(bytes32 indexed cityId, string name, uint256 totalPOIs);
    event CityUpdated(bytes32 indexed cityId, string badgeImageURI);

    modifier onlyOwner() {
        require(msg.sender == owner, "CityRegistry: not owner");
        _;
    }

    constructor() {
        owner = msg.sender;

        // Seed: Cannes = 12 POIs (ETHGlobal Cannes 2026)
        bytes32 cannesId = keccak256(bytes("cannes"));
        cities[cannesId] = City({
            name: "Cannes",
            totalPOIs: 12,
            badgeImageURI: "ipfs://bafybeicannespoi/cannes-badge.png",
            active: true
        });
        emit CityAdded(cannesId, "Cannes", 12);
    }

    /// @notice Add a new city (owner only)
    function addCity(
        bytes32 cityId,
        string calldata name,
        uint256 totalPOIs,
        string calldata badgeImageURI
    ) external onlyOwner {
        require(totalPOIs > 0, "CityRegistry: zero POIs");
        require(!cities[cityId].active, "CityRegistry: city exists");
        cities[cityId] = City(name, totalPOIs, badgeImageURI, true);
        emit CityAdded(cityId, name, totalPOIs);
    }

    /// @notice Update badge image URI (owner only, after IPFS pin)
    function setBadgeImageURI(bytes32 cityId, string calldata uri) external onlyOwner {
        require(cities[cityId].active, "CityRegistry: unknown city");
        cities[cityId].badgeImageURI = uri;
        emit CityUpdated(cityId, uri);
    }

    function getCityPOICount(bytes32 cityId) external view returns (uint256) {
        return cities[cityId].totalPOIs;
    }

    function getCityName(bytes32 cityId) external view returns (string memory) {
        return cities[cityId].name;
    }

    function getBadgeImageURI(bytes32 cityId) external view returns (string memory) {
        return cities[cityId].badgeImageURI;
    }

    function isActive(bytes32 cityId) external view returns (bool) {
        return cities[cityId].active;
    }
}
