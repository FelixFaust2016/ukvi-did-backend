import crypto from "crypto";

const { publicKey, privateKey } = crypto.generateKeyPairSync("ec", {
  namedCurve: "secp256k1", // Choose the elliptic curve (e.g., 'secp256k1', 'prime256v1')
  publicKeyEncoding: {
    type: "spki", // Subject Public Key Info format
    format: "pem",
  },
  privateKeyEncoding: {
    type: "pkcs8", // Private Key Cryptography Standards format
    format: "pem",
  },
});

export { privateKey, publicKey };
