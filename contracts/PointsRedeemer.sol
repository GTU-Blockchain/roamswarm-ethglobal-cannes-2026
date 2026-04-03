// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title PointsRedeemer
/// @notice Burns 500 ROAM points → free POI unlock (identical content to paid unlock)
contract PointsRedeemer {
    address public roamPoints;
    address public poiRegistry;

    uint256 public constant UNLOCK_THRESHOLD = 500 * 10 ** 18;

    event PointsRedeemed(address indexed user, bytes32 indexed poiId, uint256 pointsBurned);

    constructor(address _roamPoints, address _poiRegistry) {
        roamPoints = _roamPoints;
        poiRegistry = _poiRegistry;
    }

    function redeemForUnlock(bytes32 poiId) external {
        // TODO: implement — burn UNLOCK_THRESHOLD, call poiRegistry.recordUnlock, emit event
    }
}
