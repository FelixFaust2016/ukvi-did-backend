import crypto from "crypto";

// Base64Url encoding helper
const base64urlEncode = (input: Buffer | string) => {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

export const signWithHSM = (privateKey: string, data: Record<string, any>) => {
  const header = { alg: "ES256", typ: "JWT" };

  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(data));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const sign = crypto.createSign("SHA256");
  sign.update(dataToSign);
  sign.end();

  // Get signature in DER format (as ES256 expects)
  const derSignature = sign.sign({ key: privateKey, dsaEncoding: "ieee-p1363" });

  const jwtSignature = base64urlEncode(derSignature);

  const credentialJWT = `${dataToSign}.${jwtSignature}`;

  return { signature: jwtSignature, credentialJWT };
};
