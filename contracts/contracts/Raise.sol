// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IdentityRegistry} from "./IdentityRegistry.sol";
import {BlockToken} from "./BlockToken.sol";

/// @title Raise
/// @notice All-or-nothing raise for one property.
///  - Residents get a first-access window, then any verified investor can commit.
///  - Investors can cancel for a full refund until the cancel cutoff (48 hours before the deadline under Reg CF).
///  - If the goal is met the money goes to the property's treasury and tokens are created;
///    if not, everyone gets every dollar back.
/// In production the dollars sit with a regulated escrow agent and this contract mirrors the commitments;
/// on the test network it holds test USDC itself so the full flow can be demonstrated.
contract Raise {
    using SafeERC20 for IERC20;

    enum State {
        Open,
        Succeeded,
        Failed
    }

    BlockToken public immutable token;
    IERC20 public immutable usdc;
    IdentityRegistry public immutable registry;
    address public immutable treasury;
    uint256 public immutable pricePerUnit;
    uint256 public immutable goalUnits;
    uint256 public immutable opensAt;
    uint256 public immutable residentWindowEnd;
    uint256 public immutable cancelCutoff;
    uint256 public immutable deadline;

    State public state;
    uint256 public totalUnits;
    uint256 public investorCount;
    mapping(address => uint256) public unitsOf;
    mapping(bytes32 => uint256) public personUnits;

    event Committed(address indexed investor, uint256 units, uint256 paid, bool local);
    event Cancelled(address indexed investor, uint256 units, uint256 refunded);
    event Finalized(State state, uint256 totalUnits, uint256 raised);
    event TokensClaimed(address indexed investor, uint256 units);
    event Refunded(address indexed investor, uint256 amount);

    error NotOpen();
    error NotVerified();
    error ResidentsOnly();
    error OverGoal();
    error OverPersonCap();
    error TooLateToCancel();
    error NothingToDo();
    error TooEarly();

    constructor(
        BlockToken token_,
        IERC20 usdc_,
        IdentityRegistry registry_,
        address treasury_,
        uint256 pricePerUnit_,
        uint256 goalUnits_,
        uint256 opensAt_,
        uint256 residentWindowEnd_,
        uint256 cancelCutoff_,
        uint256 deadline_
    ) {
        token = token_;
        usdc = usdc_;
        registry = registry_;
        treasury = treasury_;
        pricePerUnit = pricePerUnit_;
        goalUnits = goalUnits_;
        opensAt = opensAt_;
        residentWindowEnd = residentWindowEnd_;
        cancelCutoff = cancelCutoff_;
        deadline = deadline_;
    }

    function commit(uint256 units) external {
        if (state != State.Open || block.timestamp < opensAt || block.timestamp >= deadline) revert NotOpen();
        if (!registry.isVerified(msg.sender)) revert NotVerified();
        bool local = registry.isLocal(msg.sender);
        if (block.timestamp < residentWindowEnd && !local) revert ResidentsOnly();
        if (totalUnits + units > goalUnits) revert OverGoal();
        bytes32 person = registry.personOf(msg.sender);
        if (personUnits[person] + units > token.personCap()) revert OverPersonCap();

        if (unitsOf[msg.sender] == 0) investorCount++;
        unitsOf[msg.sender] += units;
        personUnits[person] += units;
        totalUnits += units;
        uint256 paid = units * pricePerUnit;
        usdc.safeTransferFrom(msg.sender, address(this), paid);
        emit Committed(msg.sender, units, paid, local);
    }

    function cancel() external {
        if (state != State.Open) revert NotOpen();
        if (block.timestamp >= cancelCutoff) revert TooLateToCancel();
        uint256 units = unitsOf[msg.sender];
        if (units == 0) revert NothingToDo();
        unitsOf[msg.sender] = 0;
        personUnits[registry.personOf(msg.sender)] -= units;
        totalUnits -= units;
        investorCount--;
        uint256 refunded = units * pricePerUnit;
        usdc.safeTransfer(msg.sender, refunded);
        emit Cancelled(msg.sender, units, refunded);
    }

    /// @notice Anyone can close the raise once cancellations are over and it is either full or past its deadline.
    function finalize() external {
        if (state != State.Open) revert NotOpen();
        if (block.timestamp < cancelCutoff) revert TooEarly();
        if (totalUnits < goalUnits && block.timestamp < deadline) revert TooEarly();
        if (totalUnits >= goalUnits) {
            state = State.Succeeded;
            usdc.safeTransfer(treasury, totalUnits * pricePerUnit);
        } else {
            state = State.Failed;
        }
        emit Finalized(state, totalUnits, totalUnits * pricePerUnit);
    }

    function claimTokens() external {
        if (state != State.Succeeded) revert NotOpen();
        uint256 units = unitsOf[msg.sender];
        if (units == 0) revert NothingToDo();
        unitsOf[msg.sender] = 0;
        token.mint(msg.sender, units);
        emit TokensClaimed(msg.sender, units);
    }

    function refund() external {
        if (state != State.Failed) revert NotOpen();
        uint256 units = unitsOf[msg.sender];
        if (units == 0) revert NothingToDo();
        unitsOf[msg.sender] = 0;
        uint256 amount = units * pricePerUnit;
        usdc.safeTransfer(msg.sender, amount);
        emit Refunded(msg.sender, amount);
    }
}
