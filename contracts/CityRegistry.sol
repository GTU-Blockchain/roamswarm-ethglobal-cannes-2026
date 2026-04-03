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

    constructor() {
        owner = msg.sender;
        // Seed: Cannes = 12 POIs
        bytes32 cannesId = keccak256("cannes");
        cities[cannesId] = City("Cannes", 12, "ipfs://", true);
        emit CityAdded(cannesId, "Cannes", 12);
    }

    function addCity(
        bytes32 cityId,
        string calldata name,
        uint256 totalPOIs,
        string calldata badgeImageURI
    ) external {
        require(msg.sender == owner, "Not owner");
        cities[cityId] = City(name, totalPOIs, badgeImageURI, true);
        emit CityAdded(cityId, name, totalPOIs);
    }

    function getCityPOICount(bytes32 cityId) external view returns (uint256) {
        return cities[cityId].totalPOIs;
    }
}
