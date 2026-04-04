// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface ICommissionSplitter {
    function split(address contributor) external payable;
}

interface IUserPOIRegistry {
    function recordUnlock(address user, bytes32 poiId) external;
}

/// @title RoamEscrow
/// @notice Holds ETH payment; releases to CommissionSplitter when audio URL delivered from 0G
contract RoamEscrow {
    address public owner;
    ICommissionSplitter public commissionSplitter;
    IUserPOIRegistry public poiRegistry;

    struct Payment {
        address payer;
        address contributor;
        uint256 amount;
        bool released;
        bool refunded;
    }

    // key = keccak256(poiId, payer) — each user has their own lock per POI
    mapping(bytes32 => Payment) public payments;

    function _key(bytes32 poiId, address payer) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(poiId, payer));
    }

    event PaymentLocked(bytes32 indexed poiId, address indexed payer, address contributor, uint256 amount);
    event PaymentReleased(bytes32 indexed poiId, address indexed payer, string audioUrl);
    event PaymentRefunded(bytes32 indexed poiId, address payer, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _commissionSplitter, address _poiRegistry) {
        owner = msg.sender;
        commissionSplitter = ICommissionSplitter(_commissionSplitter);
        poiRegistry = IUserPOIRegistry(_poiRegistry);
    }

    function lockPayment(bytes32 poiId, address contributor) external payable {
        require(msg.value > 0, "No payment");
        bytes32 k = _key(poiId, msg.sender);
        require(payments[k].payer == address(0), "Already locked");
        require(contributor != address(0), "Invalid contributor");

        payments[k] = Payment({
            payer: msg.sender,
            contributor: contributor,
            amount: msg.value,
            released: false,
            refunded: false
        });

        emit PaymentLocked(poiId, msg.sender, contributor, msg.value);
    }

    function release(bytes32 poiId, address payer, string calldata audioUrl) external onlyOwner {
        bytes32 k = _key(poiId, payer);
        Payment storage p = payments[k];
        require(p.payer != address(0), "No payment");
        require(!p.released && !p.refunded, "Already settled");
        require(bytes(audioUrl).length > 0, "Empty audioUrl");

        p.released = true;
        commissionSplitter.split{value: p.amount}(p.contributor);

        poiRegistry.recordUnlock(payer, poiId);

        emit PaymentReleased(poiId, payer, audioUrl);
    }

    function refund(bytes32 poiId) external {
        bytes32 k = _key(poiId, msg.sender);
        Payment storage p = payments[k];
        require(p.payer == msg.sender, "Not payer");
        require(!p.released && !p.refunded, "Already settled");

        p.refunded = true;
        uint256 amount = p.amount;

        (bool ok, ) = p.payer.call{value: amount}("");
        require(ok, "Refund failed");

        emit PaymentRefunded(poiId, p.payer, amount);
    }
}
