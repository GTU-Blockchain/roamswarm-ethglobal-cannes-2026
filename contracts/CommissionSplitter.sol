// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title CommissionSplitter
/// @notice On each escrow release: 80% platform, 20% contributor
contract CommissionSplitter {
    uint256 public constant CONTRIBUTOR_BPS = 2000;
    uint256 public constant PLATFORM_BPS = 8000;

    address public platform;

    event CommissionSplit(address indexed contributor, uint256 contributorAmount, uint256 platformAmount);

    constructor(address _platform) { platform = _platform; }

    function split(address contributor, uint256 amount) external payable {
        // TODO: implement
    }
}
