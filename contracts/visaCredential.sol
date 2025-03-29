// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract VisaCredentialRegistry {
    struct Proof {
        string signature;
        string issuedAt;
        string expiresAt;
    }

    struct Credential {
        string txHash;
        string issuerDID;
        string holderDID;
        string vcHash;
        Proof proof;
        string ipfsCID;
        string status; // "unclaimed", "claimed", "revoked"
    }

    mapping(string => Credential) private credentials; // Mapping vcHash -> Credential
    string[] private credentialHashes; // Store all issued credential hashes

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
        string memory signature,
        string memory issuedAt,
        string memory expiresAt,
        string memory ipfsCID
    ) public onlyIssuer {
        require(bytes(credentials[vcHash].vcHash).length == 0, "Credential already exists");

        credentials[vcHash] = Credential({
            txHash: txHash,
            issuerDID: "did:dev:969535dbe772594c5adc6155ce26a9eb",
            holderDID: "",
            vcHash: vcHash,
            proof: Proof(signature, issuedAt, expiresAt),
            ipfsCID: ipfsCID,
            status: "unclaimed"
        });

        credentialHashes.push(vcHash);
    }

    // Assign holder DID to an issued credential
    function claimCredential(string memory vcHash, string memory holderDID) public {
        require(bytes(credentials[vcHash].vcHash).length > 0, "Credential not found");
        require(bytes(credentials[vcHash].holderDID).length == 0, "Already claimed");

        credentials[vcHash].holderDID = holderDID;
        credentials[vcHash].status = "claimed";
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

    // Fetch a specific credential’s details
    function getCredentialDetails(string memory vcHash) public view returns (
        string memory txHash,
        string memory issuerDID,
        string memory holderDID,
        string memory ipfsCID,
        string memory status,
        string memory signature,
        string memory issuedAt,
        string memory expiresAt
    ) {
        require(bytes(credentials[vcHash].vcHash).length > 0, "Credential not found");

        Credential memory cred = credentials[vcHash];

        return (
            cred.txHash,
            cred.issuerDID,
            cred.holderDID,
            cred.ipfsCID,
            cred.status,
            cred.proof.signature,
            cred.proof.issuedAt,
            cred.proof.expiresAt
        );
    }

    // Fetch all credential hashes
    function getAllCredentialHashes() public view returns (string[] memory) {
        return credentialHashes;
    }

    // Fetch all credentials by status
    function getCredentialsByStatus(string memory status) public view returns (string[] memory) {
        string[] memory filteredHashes = new string[](credentialHashes.length);
        uint count = 0;

        for (uint i = 0; i < credentialHashes.length; i++) {
            if (keccak256(abi.encodePacked(credentials[credentialHashes[i]].status)) == keccak256(abi.encodePacked(status))) {
                filteredHashes[count] = credentialHashes[i];
                count++;
            }
        }

        // Resize the array to fit the actual number of results
        assembly { mstore(filteredHashes, count) }
        return filteredHashes;
    }
}
