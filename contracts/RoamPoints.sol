// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title RoamPoints
/// @notice Non-transferable ERC-20; accrues +10 pts per owned POI per day
/// @dev Points economy: 500 pts = 1 free unlock (~0.5 USDC)
contract RoamPoints is ERC20 {
    uint256 public constant POINTS_PER_POI_PER_DAY = 10 * 10 ** 18;
    uint256 public constant UNLOCK_THRESHOLD = 500 * 10 ** 18;
    uint256 public constant CLAIM_INTERVAL = 1 days;

    address public poiRegistry;
    mapping(address => uint256) public lastClaimed;

    event PointsClaimed(address indexed user, uint256 amount);

    constructor(address _poiRegistry) ERC20("Roam Points", "ROAM") {
        poiRegistry = _poiRegistry;
    }

    function transfer(address, uint256) public pure override returns (bool) {
        revert("ROAM: non-transferable");
    }

    function transferFrom(address, address, uint256) public pure override returns (bool) {
        revert("ROAM: non-transferable");
    }

    function claimDailyPoints() external {
        // TODO: implement — get ownedCount from UserPOIRegistry, mint ownedCount * POINTS_PER_POI_PER_DAY
    }

    function mint(address to, uint256 amount) external {
        // TODO: restrict to authorized callers
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external {
        // TODO: restrict to PointsRedeemer
        _burn(from, amount);
    }
}
