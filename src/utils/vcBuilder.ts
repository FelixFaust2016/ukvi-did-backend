export const vcBuilder = (
  subjectDid: string,
  scope: string[],
  serviceEndpoint: string,
  data: Record<string, any>,
  signature: string
) => {
  const now = new Date().toISOString();

  const issuerDid = "did:dev:969535dbe772594c5adc6155ce26a9eb"

  return {
    "@context": [
      "https://www.w3.org/2018/credentials/v1",
      "https://w3id.org/security/suites/secp256k1-2019/v1",
      "https://ukvi.uk.gov.eu"
    ],
    id: `urn:uuid:${crypto.randomUUID()}`,
    type: ["VerifiableCredential", ...scope],
    issuer: issuerDid,
    issuanceDate: now,
    credentialSubject: {
      did: subjectDid,
      ...data
    },
    proof: {
      type: "EcdsaSecp256k1VerificationKey2019",
      created: now,
      proofPurpose: "assertionMethod",
      verificationMethod: `${issuerDid}#keys-1`,
      proofValue: signature
    }
  };
};
