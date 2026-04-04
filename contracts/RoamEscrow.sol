// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface ICommissionSplitter {
    function split(address contributor) external payable;
}

/// @title RoamEscrow
/// @notice Holds ETH payment; releases to CommissionSplitter when audio URL delivered from 0G
contract RoamEscrow {
    address public owner;
    ICommissionSplitter public commissionSplitter;

    struct Payment {
        address payer;
        address contributor;
        uint256 amount;
        bool released;
        bool refunded;
    }

    mapping(bytes32 => Payment) public payments;

    event PaymentLocked(bytes32 indexed poiId, address indexed payer, address contributor, uint256 amount);
    event PaymentReleased(bytes32 indexed poiId, string audioUrl);
    event PaymentRefunded(bytes32 indexed poiId, address payer, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _commissionSplitter) {
        owner = msg.sender;
        commissionSplitter = ICommissionSplitter(_commissionSplitter);
    }

    function lockPayment(bytes32 poiId, address contributor) external payable {
        require(msg.value > 0, "No payment");
        require(payments[poiId].payer == address(0), "Already locked");
        require(contributor != address(0), "Invalid contributor");

        payments[poiId] = Payment({
            payer: msg.sender,
            contributor: contributor,
            amount: msg.value,
            released: false,
            refunded: false
        });

        emit PaymentLocked(poiId, msg.sender, contributor, msg.value);
    }

    function release(bytes32 poiId, string calldata audioUrl) external onlyOwner {
        Payment storage p = payments[poiId];
        require(p.payer != address(0), "No payment");
        require(!p.released && !p.refunded, "Already settled");
        require(bytes(audioUrl).length > 0, "Empty audioUrl");

        p.released = true;
        commissionSplitter.split{value: p.amount}(p.contributor);

        emit PaymentReleased(poiId, audioUrl);
    }

    function refund(bytes32 poiId) external {
        Payment storage p = payments[poiId];
        require(p.payer == msg.sender, "Not payer");
        require(!p.released && !p.refunded, "Already settled");

        p.refunded = true;
        uint256 amount = p.amount;

        (bool ok, ) = p.payer.call{value: amount}("");
        require(ok, "Refund failed");

        emit PaymentRefunded(poiId, p.payer, amount);
    }
}
