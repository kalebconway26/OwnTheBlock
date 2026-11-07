// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IdentityRegistry} from "./IdentityRegistry.sol";

/// @title BlockToken
/// @notice Membership units of one property's LLC. 1 token = 1 LLC unit = $10.
/// The neighborhood's Charter rules are enforced on every transfer:
///  - only ID-verified people can hold tokens
///  - no single person (across all their wallets) can exceed the per-person cap
///  - the local-ownership floor can't be broken by selling to outsiders
///  - nothing moves during the 12-month legal lockup
/// Net rent is paid out in USDC pro rata to holders (pull-based, so one deposit pays any number of owners).
/// The rent cap is enforced in code: the manager can raise rent at most once a year, by at most `rentCapBps`.
contract BlockToken is ERC20, ERC20Votes {
    using SafeERC20 for IERC20;

    enum Rule {
        MaxPersonBps, // per-person cap, in basis points of supplyCap
        LocalFloorBps, // minimum share of supply that must stay with local holders
        RentCapBps, // max yearly rent increase
        ReserveBps // repair reserve share of rent (informational; the manager's report must honor it)
    }

    uint256 private constant MAG = 2 ** 128;
    uint256 public constant RENT_INTERVAL = 365 days;

    IdentityRegistry public immutable registry;
    IERC20 public immutable usdc;
    uint256 public immutable supplyCap;
    uint256 public immutable lockupUntil;
    string public propertyRef; // e.g. county parcel id + deed book/page

    address public admin; // OwnTheBlock, as LLC manager
    address public manager; // licensed property manager
    address public minter; // the Raise contract
    address public charter; // the CharterGovernor

    mapping(Rule => uint256) public rules;
    mapping(bytes32 => uint256) public personBalance;
    uint256 public localSupply;

    uint256 public monthlyRent; // in USDC base units
    uint256 public lastRentChange;

    uint256 private magPerShare;
    mapping(address => int256) private corrections;
    mapping(address => uint256) public withdrawn;
    uint256 public totalDistributed;
    uint256 public payoutCount;

    event RuleChanged(Rule indexed rule, uint256 value);
    event RentDistributed(uint256 indexed payoutIndex, uint256 amount, bytes32 reportHash);
    event PayoutClaimed(address indexed holder, uint256 amount);
    event RentChanged(uint256 oldRent, uint256 newRent);
    event RentPaymentLogged(bytes32 indexed tenantRef, uint16 indexed month, bool onTime);
    event DocumentAnchored(bytes32 indexed docHash, string kind);
    event RoleSet(string role, address account);

    error NotAllowed();
    error AlreadySet();
    error Locked();
    error NotVerified(address account);
    error PersonCapExceeded(bytes32 personId, uint256 newBalance, uint256 cap);
    error LocalFloorBroken(uint256 localSupply, uint256 required);
    error RentIncreaseTooLarge(uint256 requested, uint256 max);
    error RentChangedTooRecently();
    error NoHolders();

    constructor(
        string memory name_,
        string memory symbol_,
        string memory propertyRef_,
        IdentityRegistry registry_,
        IERC20 usdc_,
        uint256 supplyCap_,
        uint256 lockupUntil_,
        address manager_,
        uint256 monthlyRent_,
        uint256[4] memory initialRules
    ) ERC20(name_, symbol_) EIP712(name_, "1") {
        registry = registry_;
        usdc = usdc_;
        supplyCap = supplyCap_;
        lockupUntil = lockupUntil_;
        propertyRef = propertyRef_;
        admin = msg.sender;
        manager = manager_;
        monthlyRent = monthlyRent_;
        lastRentChange = block.timestamp;
        for (uint256 i = 0; i < 4; i++) {
            rules[Rule(i)] = initialRules[i];
            emit RuleChanged(Rule(i), initialRules[i]);
        }
    }

    // ------------------------------------------------------------------ roles

    function decimals() public pure override returns (uint8) {
        return 0;
    }

    function setMinter(address m) external {
        if (msg.sender != admin) revert NotAllowed();
        if (minter != address(0)) revert AlreadySet();
        minter = m;
        emit RoleSet("minter", m);
    }

    function setCharter(address c) external {
        if (msg.sender != admin) revert NotAllowed();
        if (charter != address(0)) revert AlreadySet();
        charter = c;
        emit RoleSet("charter", c);
    }

    /// @notice Only the community's governor can change the Charter rules once it is set.
    function setRule(Rule rule, uint256 value) external {
        if (msg.sender != charter) revert NotAllowed();
        rules[rule] = value;
        emit RuleChanged(rule, value);
    }

    function mint(address to, uint256 units) external {
        if (msg.sender != minter) revert NotAllowed();
        _mint(to, units);
    }

    /// @notice Store the fingerprint of a real-world document (deed, appraisal, inspection, expense report).
    function anchorDocument(bytes32 docHash, string calldata kind) external {
        if (msg.sender != admin && msg.sender != manager) revert NotAllowed();
        emit DocumentAnchored(docHash, kind);
    }

    // ------------------------------------------------------------------ charter checks

    function personCap() public view returns (uint256) {
        return (supplyCap * rules[Rule.MaxPersonBps]) / 10_000;
    }

    function _update(address from, address to, uint256 value) internal override(ERC20, ERC20Votes) {
        bool isTransfer = from != address(0) && to != address(0);
        if (isTransfer && block.timestamp < lockupUntil) revert Locked();

        bytes32 fromPerson = from == address(0) ? bytes32(0) : registry.personOf(from);
        bytes32 toPerson;
        if (to != address(0)) {
            if (!registry.isVerified(to)) revert NotVerified(to);
            toPerson = registry.personOf(to);
            if (toPerson != fromPerson) {
                uint256 nb = personBalance[toPerson] + value;
                if (nb > personCap()) revert PersonCapExceeded(toPerson, nb, personCap());
            }
        }
        if (from != address(0)) personBalance[fromPerson] -= value;
        if (to != address(0)) personBalance[toPerson] += value;

        bool fromLocal = from != address(0) && registry.isLocal(from);
        bool toLocal = to != address(0) && registry.isLocal(to);
        if (fromLocal) localSupply -= value;
        if (toLocal) localSupply += value;

        super._update(from, to, value);

        if (isTransfer && fromLocal && !toLocal) {
            uint256 required = (totalSupply() * rules[Rule.LocalFloorBps]) / 10_000;
            if (localSupply < required) revert LocalFloorBroken(localSupply, required);
        }

        // payout bookkeeping: tokens carry only future payouts
        int256 delta = int256(magPerShare * value);
        if (from != address(0)) corrections[from] += delta;
        if (to != address(0)) corrections[to] -= delta;

        // every holder votes by default
        if (to != address(0) && delegates(to) == address(0)) _delegate(to, to);
    }

    // ------------------------------------------------------------------ payouts

    /// @notice Manager deposits the month's net rent; it is split across every holder in one transaction.
    /// @param reportHash fingerprint of the monthly expense report the investors can check against
    function distribute(uint256 amount, bytes32 reportHash) external {
        if (msg.sender != manager) revert NotAllowed();
        uint256 supply = totalSupply();
        if (supply == 0) revert NoHolders();
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        magPerShare += (amount * MAG) / supply;
        totalDistributed += amount;
        emit RentDistributed(payoutCount++, amount, reportHash);
    }

    function claimable(address holder) public view returns (uint256) {
        int256 acc = int256(magPerShare * balanceOf(holder)) + corrections[holder];
        return uint256(acc) / MAG - withdrawn[holder];
    }

    function claim() external returns (uint256 amount) {
        amount = claimable(msg.sender);
        if (amount == 0) return 0;
        withdrawn[msg.sender] += amount;
        usdc.safeTransfer(msg.sender, amount);
        emit PayoutClaimed(msg.sender, amount);
    }

    // ------------------------------------------------------------------ tenant protections

    /// @notice Rent can rise at most once a year and by at most the Charter's rent cap.
    function setRent(uint256 newRent) external {
        if (msg.sender != manager) revert NotAllowed();
        if (newRent > monthlyRent) {
            if (block.timestamp < lastRentChange + RENT_INTERVAL) revert RentChangedTooRecently();
            uint256 max = (monthlyRent * (10_000 + rules[Rule.RentCapBps])) / 10_000;
            if (newRent > max) revert RentIncreaseTooLarge(newRent, max);
        }
        emit RentChanged(monthlyRent, newRent);
        monthlyRent = newRent;
        lastRentChange = block.timestamp;
    }

    /// @notice On-time rent history the tenant can carry to a lender. `tenantRef` is a hash, not a name.
    function logRentPayment(bytes32 tenantRef, uint16 month, bool onTime) external {
        if (msg.sender != manager) revert NotAllowed();
        emit RentPaymentLogged(tenantRef, month, onTime);
    }
}
