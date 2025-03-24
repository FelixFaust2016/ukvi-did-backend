import * as crypto from 'crypto';

interface VCData {
    visaID: string;
    passportExpiryDate: string;
}

export const computeCredentialHash = (vcData: VCData): string => {
    const minimalVC = {
        visaID: vcData.visaID,
        validUntil: vcData.passportExpiryDate,
        issuer: "did:dev:969535dbe772594c5adc6155ce26a9eb"
    };

    return crypto.createHash("sha256").update(JSON.stringify(minimalVC)).digest("hex");
};
