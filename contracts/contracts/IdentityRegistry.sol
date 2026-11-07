// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IdentityRegistry
/// @notice Records which wallets passed the ID check. No personal data goes on-chain:
/// each verified person gets an opaque `personId` (a salted hash held by the KYC provider),
/// so caps can be enforced per person even if someone uses several wallets.
contract IdentityRegistry {
    struct Identity {
        bool verified;
        bool local; // lives in the neighborhood's zip codes
        bytes32 personId;
    }

    address public verifier;
    mapping(address => Identity) private ids;

    event Verified(address indexed wallet, bytes32 indexed personId, bool local);
    event Revoked(address indexed wallet);
    event VerifierChanged(address indexed verifier);

    error NotVerifier();
    error EmptyPersonId();

    modifier onlyVerifier() {
        if (msg.sender != verifier) revert NotVerifier();
        _;
    }

    constructor(address verifier_) {
        verifier = verifier_;
        emit VerifierChanged(verifier_);
    }

    function verify(address wallet, bytes32 personId, bool local) external onlyVerifier {
        if (personId == bytes32(0)) revert EmptyPersonId();
        ids[wallet] = Identity(true, local, personId);
        emit Verified(wallet, personId, local);
    }

    function revoke(address wallet) external onlyVerifier {
        delete ids[wallet];
        emit Revoked(wallet);
    }

    function setVerifier(address next) external onlyVerifier {
        verifier = next;
        emit VerifierChanged(next);
    }

    function isVerified(address wallet) external view returns (bool) {
        return ids[wallet].verified;
    }

    function isLocal(address wallet) external view returns (bool) {
        return ids[wallet].local;
    }

    function personOf(address wallet) external view returns (bytes32) {
        return ids[wallet].personId;
    }
}
