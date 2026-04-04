// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title CommissionSplitter
/// @notice On each escrow release: 80% platform, 20% contributor
contract CommissionSplitter {
    uint256 public constant CONTRIBUTOR_BPS = 2000; // 20%
    uint256 public constant PLATFORM_BPS = 8000;    // 80%
    uint256 public constant BPS_BASE = 10000;

    address public platform;

    event CommissionSplit(address indexed contributor, uint256 contributorAmount, uint256 platformAmount);

    constructor(address _platform) {
        require(_platform != address(0), "Invalid platform");
        platform = _platform;
    }

    /// @notice Split msg.value: 20% to contributor, 80% to platform
    /// @dev Called by RoamEscrow.release() with {value: payment}
    function split(address contributor) external payable {
        require(msg.value > 0, "No value");
        require(contributor != address(0), "Invalid contributor");

        uint256 contributorAmount = (msg.value * CONTRIBUTOR_BPS) / BPS_BASE;
        uint256 platformAmount = msg.value - contributorAmount;

        (bool okC, ) = contributor.call{value: contributorAmount}("");
        require(okC, "Contributor transfer failed");

        (bool okP, ) = platform.call{value: platformAmount}("");
        require(okP, "Platform transfer failed");

        emit CommissionSplit(contributor, contributorAmount, platformAmount);
    }
}
