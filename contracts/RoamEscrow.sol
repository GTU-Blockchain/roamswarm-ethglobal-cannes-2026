// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title RoamEscrow
/// @notice Holds x402 USDC payment; releases when valid audio URL delivered from 0G Storage
contract RoamEscrow {
    address public owner;

    struct Payment {
        address payer;
        address contributor;
        uint256 amount;
        bool released;
        bool refunded;
    }

    mapping(bytes32 => Payment) public payments;

    event PaymentLocked(bytes32 indexed poiId, address payer, uint256 amount);
    event PaymentReleased(bytes32 indexed poiId, string audioUrl);
    event PaymentRefunded(bytes32 indexed poiId);

    constructor() { owner = msg.sender; }

    function lockPayment(bytes32 poiId, address contributor) external payable {
        // TODO: implement
    }

    function release(bytes32 poiId, string calldata audioUrl) external {
        // TODO: implement — only owner, calls CommissionSplitter
    }

    function refund(bytes32 poiId) external {
        // TODO: implement
    }
}
