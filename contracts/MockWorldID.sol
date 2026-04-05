// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title MockWorldID
/// @notice Staging mock for World ID verifier — accepts any proof.
///         Use only on testnets / hackathon demos.
///         The real IWorldID interface is preserved so ContributorRegistry
///         works identically in production by just swapping the address.
contract MockWorldID {
    /// @notice Always passes — mirrors the real World ID verifyProof interface.
    function verifyProof(
        uint256 /* root */,
        uint256 /* groupId */,
        uint256 /* signalHash */,
        uint256 /* nullifierHash */,
        uint256 /* externalNullifierHash */,
        uint256[8] calldata /* proof */
    ) external pure {
        // No-op: accept any proof on staging
    }
}
