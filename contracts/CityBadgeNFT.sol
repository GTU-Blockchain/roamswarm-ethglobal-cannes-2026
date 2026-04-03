// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @title CityBadgeNFT
/// @notice ERC-721; auto-minted when user unlocks all POIs in a city
/// @dev Completion also grants +100 bonus ROAM points
contract CityBadgeNFT is ERC721 {
    uint256 private _tokenIdCounter;

    address public poiRegistry;
    address public cityRegistry;
    address public roamPoints;

    uint256 public constant COMPLETION_BONUS = 100 * 10 ** 18;

    mapping(address => mapping(bytes32 => bool)) public hasBadge;
    mapping(uint256 => bytes32) public tokenCity;

    event BadgeMinted(address indexed user, bytes32 indexed cityId, uint256 tokenId);

    constructor(address _poiRegistry, address _cityRegistry, address _roamPoints)
        ERC721("Roam City Badge", "ROAMBADGE")
    {
        poiRegistry = _poiRegistry;
        cityRegistry = _cityRegistry;
        roamPoints = _roamPoints;
    }

    function checkAndMint(address user, bytes32 cityId) external {
        // TODO: implement — check unlocked == totalPOIs, mint NFT, grant bonus points
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        // TODO: return IPFS metadata URI with city name, completion date, POI count, ENS
        return string(abi.encodePacked("ipfs://roam-badges/", tokenId));
    }
}
