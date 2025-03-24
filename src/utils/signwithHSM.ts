import crypto from "crypto";

export const signWithHSM = (privateKey: string, data: Record<string, any>) => {
  const header = { alg: "ES256", typ: "JWT" };

  // Base64Url encoding function
  const base64urlEncode = (input: string) => {
    return Buffer.from(input)
      .toString("base64") // Base64 encoding
      .replace(/\+/g, "-") // Replace '+' with '-'
      .replace(/\//g, "_") // Replace '/' with '_'
      .replace(/=+$/, ""); // Remove any trailing '='
  };

  // Encode header and payload
  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(data));

  // Concatenate header and payload to create the data to be signed
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  // Sign the data using the ES256 algorithm (ECDSA with P-256 curve)
  const sign = crypto.createSign("SHA256");
  sign.update(dataToSign);
  sign.end();

  // Sign the data with the private key
  const signature = sign.sign(privateKey).toString("hex");

  // Base64Url encode the signature
  const jwtSignature = base64urlEncode(signature);

  // Construct the final JWT
  const credentialJWT = `${encodedHeader}.${encodedPayload}.${jwtSignature}`;

  return { signature, credentialJWT };
};
