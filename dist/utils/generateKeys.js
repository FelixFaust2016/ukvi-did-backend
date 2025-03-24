"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicKey = exports.privateKey = void 0;
const crypto_1 = __importDefault(require("crypto"));
const { publicKey, privateKey } = crypto_1.default.generateKeyPairSync("ec", {
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
exports.publicKey = publicKey;
exports.privateKey = privateKey;
