// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract VisaCredentialRegistry {
    struct Credential {
        bytes32 credentialHash;
        string visaID;
        string validUntil;
        string applicantDID;
        string issuerDID;
        bool issued;
    }

    mapping(bytes32 => Credential) public credentials;
    bytes32[] public credentialHashes; 
    address public issuer;

    modifier onlyIssuer() {
        require(msg.sender == issuer, "Not authorized");
        _;
    }

    constructor() {
        issuer = msg.sender;
    }

    function issueCredential(
        bytes32 credentialHash,
        string memory visaID,
        string memory validUntil,
        string memory issuerDID
    ) public onlyIssuer {
        require(!credentials[credentialHash].issued, "Credential already exists");

        credentials[credentialHash] = Credential(credentialHash, visaID, validUntil, "", issuerDID, true);
        credentialHashes.push(credentialHash); // ✅ Fix: Store the hash
    }

    function updateApplicantDID(bytes32 credentialHash, string memory applicantDID) public {
        require(credentials[credentialHash].issued, "Credential not found");
        require(bytes(credentials[credentialHash].applicantDID).length == 0, "DID already set");
        credentials[credentialHash].applicantDID = applicantDID;
    }

    function verifyCredential(bytes32 credentialHash) public view returns (bool) {
        return credentials[credentialHash].issued;
    }

    function getAllCredentials() public view returns (bytes32[] memory) {
        return credentialHashes; // ✅ Now returns stored credential hashes
    }

    function getCredentialDetails(bytes32 credentialHash) public view returns (
        string memory visaID,
        string memory validUntil,
        string memory applicantDID,
        string memory issuerDID,
        bool issued
    ) {
        Credential memory cred = credentials[credentialHash];
        return (cred.visaID, cred.validUntil, cred.applicantDID, cred.issuerDID, cred.issued);
    }
}
