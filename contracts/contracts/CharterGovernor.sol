// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IdentityRegistry} from "./IdentityRegistry.sol";
import {BlockToken} from "./BlockToken.sol";

/// @title CharterGovernor
/// @notice The only way to change a property's Charter rules.
///  - Owners vote with the tokens they held when the proposal was made (no buying votes mid-vote).
///  - Verified residents' votes count 1.5x.
///  - A change needs a quorum and a 2/3 supermajority, then waits out a timelock (30 days in production).
///  - The steward can veto changes to the affordability rules (rent cap, repair reserve).
contract CharterGovernor {
    struct Proposal {
        BlockToken.Rule rule;
        uint256 value;
        uint256 snapshot; // block number
        uint256 voteEnd;
        uint256 forVotes;
        uint256 againstVotes;
        bool executed;
        bool vetoed;
    }

    BlockToken public immutable token;
    IdentityRegistry public immutable registry;
    address public immutable steward;
    uint256 public immutable votingPeriod;
    uint256 public immutable timelock;
    uint256 public immutable quorumBps;

    Proposal[] public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event Proposed(uint256 indexed id, address indexed proposer, BlockToken.Rule rule, uint256 value, uint256 voteEnd);
    event Voted(uint256 indexed id, address indexed voter, bool support, uint256 weight);
    event Executed(uint256 indexed id);
    event Vetoed(uint256 indexed id);

    error NoVotes();
    error VotingClosed();
    error AlreadyVoted();
    error StillVoting();
    error NotPassed();
    error TimelockActive(uint256 readyAt);
    error NotAllowed();
    error Done();

    constructor(BlockToken token_, IdentityRegistry registry_, address steward_, uint256 votingPeriod_, uint256 timelock_, uint256 quorumBps_) {
        token = token_;
        registry = registry_;
        steward = steward_;
        votingPeriod = votingPeriod_;
        timelock = timelock_;
        quorumBps = quorumBps_;
    }

    function propose(BlockToken.Rule rule, uint256 value) external returns (uint256 id) {
        if (token.getVotes(msg.sender) == 0) revert NoVotes();
        id = proposals.length;
        uint256 end = block.timestamp + votingPeriod;
        proposals.push(Proposal(rule, value, block.number - 1, end, 0, 0, false, false));
        emit Proposed(id, msg.sender, rule, value, end);
    }

    function vote(uint256 id, bool support) external {
        Proposal storage p = proposals[id];
        if (block.timestamp >= p.voteEnd) revert VotingClosed();
        if (hasVoted[id][msg.sender]) revert AlreadyVoted();
        uint256 weight = token.getPastVotes(msg.sender, p.snapshot);
        if (weight == 0) revert NoVotes();
        if (registry.isLocal(msg.sender)) weight = (weight * 3) / 2;
        hasVoted[id][msg.sender] = true;
        if (support) p.forVotes += weight;
        else p.againstVotes += weight;
        emit Voted(id, msg.sender, support, weight);
    }

    function passed(uint256 id) public view returns (bool) {
        Proposal storage p = proposals[id];
        uint256 cast = p.forVotes + p.againstVotes;
        uint256 quorum = (token.getPastTotalSupply(p.snapshot) * quorumBps) / 10_000;
        return cast >= quorum && cast > 0 && p.forVotes * 3 >= cast * 2;
    }

    function readyAt(uint256 id) public view returns (uint256) {
        return proposals[id].voteEnd + timelock;
    }

    function execute(uint256 id) external {
        Proposal storage p = proposals[id];
        if (p.executed || p.vetoed) revert Done();
        if (block.timestamp < p.voteEnd) revert StillVoting();
        if (!passed(id)) revert NotPassed();
        if (block.timestamp < readyAt(id)) revert TimelockActive(readyAt(id));
        p.executed = true;
        token.setRule(p.rule, p.value);
        emit Executed(id);
    }

    /// @notice The steward protects affordability: it can block changes to the rent cap or the reserve.
    function veto(uint256 id) external {
        Proposal storage p = proposals[id];
        if (msg.sender != steward) revert NotAllowed();
        if (p.rule != BlockToken.Rule.RentCapBps && p.rule != BlockToken.Rule.ReserveBps) revert NotAllowed();
        if (p.executed || p.vetoed) revert Done();
        p.vetoed = true;
        emit Vetoed(id);
    }

    function proposalCount() external view returns (uint256) {
        return proposals.length;
    }
}
