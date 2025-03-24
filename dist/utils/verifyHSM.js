"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyCredentialJWT = void 0;
const crypto_1 = __importDefault(require("crypto"));
const verifyCredentialJWT = (publicKey, credentialJWT) => {
    const [encodedHeader, encodedPayload, jwtSignature] = credentialJWT.split(".");
    if (!encodedHeader || !encodedPayload || !jwtSignature) {
        throw new Error("Invalid JWT format");
    }
    // Base64Url decoding function
    const base64urlDecode = (input) => {
        return Buffer.from(input.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString();
    };
    // Reconstruct the original data that was signed
    const dataToVerify = `${encodedHeader}.${encodedPayload}`;
    // Decode signature from base64url
    const signature = Buffer.from(base64urlDecode(jwtSignature), "hex");
    // Verify the signature using the public key
    const verify = crypto_1.default.createVerify("SHA256");
    verify.update(dataToVerify);
    verify.end();
    const isValid = verify.verify(publicKey, signature);
    return isValid;
};
exports.verifyCredentialJWT = verifyCredentialJWT;
