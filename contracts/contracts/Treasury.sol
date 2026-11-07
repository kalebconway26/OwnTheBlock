// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title Treasury
/// @notice The property's bank account. Every payment needs two keys: the manager proposes it with the
/// invoice's fingerprint, and the community steward must approve it. Neither OwnTheBlock nor the
/// manager can move money alone.
contract Treasury {
    using SafeERC20 for IERC20;

    struct Payment {
        address to;
        uint256 amount;
        bytes32 invoiceHash;
        string memo;
        bool done;
        bool cancelled;
    }

    IERC20 public immutable usdc;
    address public immutable manager;
    address public immutable steward;
    Payment[] public payments;

    event PaymentProposed(uint256 indexed id, address indexed to, uint256 amount, bytes32 invoiceHash, string memo);
    event PaymentApproved(uint256 indexed id, address indexed steward);
    event PaymentCancelled(uint256 indexed id, address indexed by);

    error NotAllowed();
    error NotPending();

    constructor(IERC20 usdc_, address manager_, address steward_) {
        usdc = usdc_;
        manager = manager_;
        steward = steward_;
    }

    function propose(address to, uint256 amount, bytes32 invoiceHash, string calldata memo) external returns (uint256 id) {
        if (msg.sender != manager) revert NotAllowed();
        id = payments.length;
        payments.push(Payment(to, amount, invoiceHash, memo, false, false));
        emit PaymentProposed(id, to, amount, invoiceHash, memo);
    }

    function approve(uint256 id) external {
        if (msg.sender != steward) revert NotAllowed();
        Payment storage p = payments[id];
        if (p.done || p.cancelled) revert NotPending();
        p.done = true;
        usdc.safeTransfer(p.to, p.amount);
        emit PaymentApproved(id, msg.sender);
    }

    function cancel(uint256 id) external {
        if (msg.sender != steward && msg.sender != manager) revert NotAllowed();
        Payment storage p = payments[id];
        if (p.done || p.cancelled) revert NotPending();
        p.cancelled = true;
        emit PaymentCancelled(id, msg.sender);
    }

    function paymentCount() external view returns (uint256) {
        return payments.length;
    }
}
