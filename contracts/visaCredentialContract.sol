// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract VisaCredentialContractRegistry {
    struct Credential {
        string txHash;
        string vcHash;
        string ipfsCID;
        string issuerDID;
        string issuerPublicKey;
        string issuedAt;
        string expiresAt;
        string status; // "active", "revoked"
    }

    mapping(string => Credential) private credentials; // vcHash => Credential
    string[] private credentialHashes;

    address public issuer;

    modifier onlyIssuer() {
        require(msg.sender == issuer, "Not authorized");
        _;
    }

    constructor() {
        issuer = msg.sender;
    }

    // Issue a new credential
    function issueCredential(
        string memory txHash,
        string memory vcHash,
        string memory ipfsCID,
        string memory issuerDID,
        string memory issuerPublicKey,
        string memory issuedAt,
        string memory expiresAt
    ) public onlyIssuer {
        require(bytes(credentials[vcHash].vcHash).length == 0, "Credential already exists");

        credentials[vcHash] = Credential({
            txHash: txHash,
            vcHash: vcHash,
            ipfsCID: ipfsCID,
            issuerDID: issuerDID,
            issuerPublicKey: issuerPublicKey,
            issuedAt: issuedAt,
            expiresAt: expiresAt,
            status: "active"
        });

        credentialHashes.push(vcHash);
    }

    // Revoke a credential
    function revokeCredential(string memory vcHash) public onlyIssuer {
        require(bytes(credentials[vcHash].vcHash).length > 0, "Credential not found");
        credentials[vcHash].status = "revoked";
    }

    // Verify if a credential exists and return its status
    function verifyCredential(string memory vcHash) public view returns (bool, string memory) {
        if (bytes(credentials[vcHash].vcHash).length > 0) {
            return (true, credentials[vcHash].status);
        }
        return (false, "Credential not found");
    }

    // Get credential details by hash
    function getCredentialDetails(string memory vcHash) public view returns (
        string memory txHash,
        string memory vcHashOut,
        string memory ipfsCID,
        string memory issuerDID,
        string memory issuerPublicKey,
        string memory issuedAt,
        string memory expiresAt,
        string memory status
    ) {
        require(bytes(credentials[vcHash].vcHash).length > 0, "Credential not found");

        Credential memory cred = credentials[vcHash];

        return (
            cred.txHash,
            cred.vcHash,
            cred.ipfsCID,
            cred.issuerDID,
            cred.issuerPublicKey,
            cred.issuedAt,
            cred.expiresAt,
            cred.status
        );
    }

    // Get all credential hashes
    function getAllCredentialHashes() public view returns (string[] memory) {
        return credentialHashes;
    }

    // Get credentials by status (e.g., "active", "revoked")
    function getCredentialsByStatus(string memory status) public view returns (string[] memory) {
        string[] memory filtered = new string[](credentialHashes.length);
        uint count = 0;

        for (uint i = 0; i < credentialHashes.length; i++) {
            if (
                keccak256(abi.encodePacked(credentials[credentialHashes[i]].status)) ==
                keccak256(abi.encodePacked(status))
            ) {
                filtered[count] = credentialHashes[i];
                count++;
            }
        }

        assembly { mstore(filtered, count) }
        return filtered;
    }
    
}
