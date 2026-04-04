// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IRoamPoints {
    function burn(address from, uint256 amount) external;
    function balanceOf(address account) external view returns (uint256);
    function UNLOCK_THRESHOLD() external view returns (uint256);
}

interface IUserPOIRegistry {
    function recordUnlock(address user, bytes32 poiId) external;
    function unlockedPOIs(address user, bytes32 poiId) external view returns (bool);
}

/// @title PointsRedeemer
/// @notice Burns 500 ROAM → free POI unlock (identical content to paid unlock)
contract PointsRedeemer {
    IRoamPoints public immutable roamPoints;
    IUserPOIRegistry public immutable poiRegistry;

    uint256 public constant UNLOCK_THRESHOLD = 500 * 10 ** 18;

    event PointsRedeemed(address indexed user, bytes32 indexed poiId, uint256 pointsBurned);

    constructor(address _roamPoints, address _poiRegistry) {
        roamPoints = IRoamPoints(_roamPoints);
        poiRegistry = IUserPOIRegistry(_poiRegistry);
    }

    /// @notice Burn UNLOCK_THRESHOLD ROAM points and record a free POI unlock.
    /// @param poiId The POI to unlock (must not already be unlocked by this user).
    function redeemForUnlock(bytes32 poiId) external {
        require(
            !poiRegistry.unlockedPOIs(msg.sender, poiId),
            "PointsRedeemer: already unlocked"
        );
        require(
            roamPoints.balanceOf(msg.sender) >= UNLOCK_THRESHOLD,
            "PointsRedeemer: insufficient points"
        );

        // Burn first (checks balance again inside RoamPoints._burn)
        roamPoints.burn(msg.sender, UNLOCK_THRESHOLD);

        // Record the unlock — identical to a paid unlock
        poiRegistry.recordUnlock(msg.sender, poiId);

        emit PointsRedeemed(msg.sender, poiId, UNLOCK_THRESHOLD);
    }

    /// @notice Returns true if the user has enough points to redeem a free unlock.
    function canRedeem(address user) external view returns (bool) {
        return roamPoints.balanceOf(user) >= UNLOCK_THRESHOLD;
    }
}
