import crypto from "crypto";

export const verifyCredentialJWT = (publicKey: string, credentialJWT: string) => {
  const [encodedHeader, encodedPayload, jwtSignature] = credentialJWT.split(".");

  if (!encodedHeader || !encodedPayload || !jwtSignature) {
    throw new Error("Invalid JWT format");
  }

  // Base64Url decoding function
  const base64urlDecode = (input: string) => {
    return Buffer.from(input.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString();
  };

  // Reconstruct the original data that was signed
  const dataToVerify = `${encodedHeader}.${encodedPayload}`;

  // Decode signature from base64url
  const signature = Buffer.from(base64urlDecode(jwtSignature), "hex");

  // Verify the signature using the public key
  const verify = crypto.createVerify("SHA256");
  verify.update(dataToVerify);
  verify.end();

  const isValid = verify.verify(publicKey, signature);

  return isValid;
};
