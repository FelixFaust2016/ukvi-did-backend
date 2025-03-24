"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vcBuilder = void 0;
const vcBuilder = (publicKey, scope, serviceEndpoint, data, signature) => {
    const credentials = {
        "@context": [
            "https://www.w3.org/ns/did/v1",
            "https://w3id.org/security/v1",
            "https://ukvi.uk.gov.eu",
        ],
        id: "did:dev:969535dbe772594c5adc6155ce26a9eb",
        publicKey: publicKey,
        authentication: [`did:dev:969535dbe772594c5adc6155ce26a9eb#keys-1`],
        assertionMethod: [
            {
                id: `did:dev:969535dbe772594c5adc6155ce26a9eb#assertionMethod-1`,
                scope: scope,
                verificationMethod: `did:dev:969535dbe772594c5adc6155ce26a9eb#keys-1`,
            },
        ],
        service: [
            {
                id: `did:dev:969535dbe772594c5adc6155ce26a9eb#id-1`,
                type: "IdentityVerification",
                serviceEndpoint: serviceEndpoint,
            },
        ],
        alsoKnownAs: data.email,
        userInfo: data,
        controller: [],
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        proof: {
            type: "EcdsaSecp256k1VerificationKey2019",
            created: new Date().toISOString(),
            proofValue: signature,
        },
    };
    return credentials;
};
exports.vcBuilder = vcBuilder;
