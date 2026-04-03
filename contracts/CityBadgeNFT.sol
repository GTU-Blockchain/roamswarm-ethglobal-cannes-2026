// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

interface IUserPOIRegistry {
    function getUnlockedCount(address user, bytes32 cityId) external view returns (uint256);
}

interface ICityRegistry {
    function getCityPOICount(bytes32 cityId) external view returns (uint256);
    function getCityName(bytes32 cityId) external view returns (string memory);
    function getBadgeImageURI(bytes32 cityId) external view returns (string memory);
    function isActive(bytes32 cityId) external view returns (bool);
}

interface IRoamPoints {
    function mint(address to, uint256 amount) external;
}

/// @title CityBadgeNFT
/// @notice ERC-721 auto-minted when a user unlocks all POIs in a city.
///         Completion also grants +100 bonus ROAM points.
contract CityBadgeNFT is ERC721 {
    using Strings for uint256;

    uint256 private _tokenIdCounter;

    address public poiRegistry;
    address public cityRegistry;
    address public roamPoints;
    address public owner;

    uint256 public constant COMPLETION_BONUS = 100 * 10 ** 18;

    /// @notice user → cityId → already has badge
    mapping(address => mapping(bytes32 => bool)) public hasBadge;
    /// @notice tokenId → cityId it represents
    mapping(uint256 => bytes32) public tokenCity;
    /// @notice tokenId → user address at mint time (for metadata)
    mapping(uint256 => address) public tokenOwnerAtMint;
    /// @notice tokenId → block.timestamp at mint
    mapping(uint256 => uint256) public tokenMintTime;

    /// @notice Authorized callers that can trigger checkAndMint (e.g. UserPOIRegistry, PointsRedeemer)
    mapping(address => bool) public authorized;

    event BadgeMinted(address indexed user, bytes32 indexed cityId, uint256 tokenId);
    event AuthorizedCaller(address indexed caller, bool status);

    modifier onlyOwner() {
        require(msg.sender == owner, "CityBadgeNFT: not owner");
        _;
    }

    modifier onlyAuthorized() {
        require(authorized[msg.sender] || msg.sender == owner, "CityBadgeNFT: not authorized");
        _;
    }

    constructor(address _poiRegistry, address _cityRegistry, address _roamPoints)
        ERC721("Roam City Badge", "ROAMBADGE")
    {
        poiRegistry = _poiRegistry;
        cityRegistry = _cityRegistry;
        roamPoints = _roamPoints;
        owner = msg.sender;
    }

    // ─── Core logic ──────────────────────────────────────────────────────────

    /// @notice Called after each POI unlock. Mints badge if the user completed the city.
    ///         Safe to call multiple times — idempotent once badge is minted.
    function checkAndMint(address user, bytes32 cityId) external onlyAuthorized {
        // Already has badge → nothing to do
        if (hasBadge[user][cityId]) return;

        ICityRegistry registry = ICityRegistry(cityRegistry);
        require(registry.isActive(cityId), "CityBadgeNFT: unknown city");

        uint256 total = registry.getCityPOICount(cityId);
        uint256 unlocked = IUserPOIRegistry(poiRegistry).getUnlockedCount(user, cityId);

        // Not yet complete
        if (unlocked < total) return;

        // Mint badge
        uint256 tokenId = ++_tokenIdCounter;
        hasBadge[user][cityId] = true;
        tokenCity[tokenId] = cityId;
        tokenOwnerAtMint[tokenId] = user;
        tokenMintTime[tokenId] = block.timestamp;

        _safeMint(user, tokenId);
        emit BadgeMinted(user, cityId, tokenId);

        // Grant +100 bonus ROAM points (RoamPoints must have this contract as minter)
        if (roamPoints != address(0)) {
            IRoamPoints(roamPoints).mint(user, COMPLETION_BONUS);
        }
    }

    // ─── Metadata ────────────────────────────────────────────────────────────

    /// @notice Returns on-chain JSON metadata URI for a badge token.
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return string(abi.encodePacked("data:application/json;utf8,", _buildJSON(tokenId)));
    }

    function _buildJSON(uint256 tokenId) private view returns (string memory) {
        bytes32 cityId = tokenCity[tokenId];
        ICityRegistry reg = ICityRegistry(cityRegistry);
        string memory cityName = reg.getCityName(cityId);
        string memory imageURI = reg.getBadgeImageURI(cityId);
        uint256 total = reg.getCityPOICount(cityId);

        return string(abi.encodePacked(
            '{"name":"', cityName, ' Explorer Badge",',
            '"description":"Completed all ', total.toString(), ' POIs in ', cityName, '",',
            '"image":"', imageURI, '",',
            '"attributes":', _buildAttributes(cityName, total, tokenId),
            '}'
        ));
    }

    function _buildAttributes(
        string memory cityName,
        uint256 total,
        uint256 tokenId
    ) private view returns (string memory) {
        uint256 mintTime = tokenMintTime[tokenId];
        return string(abi.encodePacked(
            '[{"trait_type":"City","value":"', cityName, '"},',
            '{"trait_type":"POIs Completed","value":', total.toString(), '},',
            '{"trait_type":"Completion Timestamp","value":', mintTime.toString(), '},',
            '{"trait_type":"Token ID","value":', tokenId.toString(), '}]'
        ));
    }

    // ─── Access control ──────────────────────────────────────────────────────

    function setAuthorized(address caller, bool status) external onlyOwner {
        authorized[caller] = status;
        emit AuthorizedCaller(caller, status);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "CityBadgeNFT: zero address");
        owner = newOwner;
    }
}
