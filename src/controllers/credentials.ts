import { NextFunction, Request, Response } from "express";
import { credentialValidator } from "../middlewares/validator";
import { signWithHSM } from "../utils/signwithHSM";
import db from "../dbConfig";
import { vcBuilder } from "../utils/vcBuilder";
import { verifyCredentialJWT } from "../utils/verifyHSM";
import { computeCredentialHash } from "../utils/computeCredentialHash";
import contractABI from "../../artifacts/contracts/visaCredential.sol/VisaCredentialRegistry.json";
import { ethers } from "ethers";
import { create } from "ipfs-http-client";
import crypto from "crypto";
import axios from "axios";
import FormData from "form-data";
import stream from "stream";
import pinataSDK from "@pinata/sdk";

if (!process.env.PRIVATE_KEY) {
  throw new Error("PRIVATE_KEY is not defined in the .env file");
}

// Ensure that CONTRACT_ADDRESS is defined
if (!process.env.CONTRACT_ADDRESS) {
  throw new Error("CONTRACT_ADDRESS is not defined in the .env file");
}

// Store Hash & Minimal Metadata on Blockchain
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
console.log("hello");

const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  contractABI.abi,
  wallet
);

const pinata = new pinataSDK(
  process.env.PINATA_API_KEY,
  process.env.PINATA_SECRET
);

// Function to Encrypt Data with Public Key
const encryptWithPublicKey = (publicKey: string, data: string) => {
  const key = crypto.createHash("sha256").update(publicKey).digest(); // Derive a symmetric key from the public key
  const iv = crypto.randomBytes(12); // Generate a random IV (Initialization Vector)

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  let encrypted = cipher.update(data, "utf8", "base64");
  encrypted += cipher.final("base64");

  const authTag = cipher.getAuthTag(); // Get authentication tag for integrity

  return {
    iv: iv.toString("base64"),
    encryptedData: encrypted,
    authTag: authTag.toString("base64"),
  };
};

export const issueCredential = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate request body
    const { error } = credentialValidator.validate(req.body);
    if (error) {
      res.status(400).json({ status: "failed", msg: error.details[0].message });
      return;
    }

    // Fetch private key from database
    const getPrivateKeyQuery = `SELECT keys FROM immigration`;
    const getPrivateKeyResult = await db.query(getPrivateKeyQuery);
    const keys = getPrivateKeyResult.rows[0].keys;
    const privateKey = keys.privateKey;
    const publicKey = keys.publicKey;

    const serviceEndpoint = process.env.UKVI_ENDPOINT || "http://api.ukvi.com";

    // Generate signature & JWT
    const { signature, credentialJWT } = signWithHSM(privateKey, req.body);

    // Create Verifiable Credential
    const verifiableCredential = vcBuilder(
      publicKey,
      Object.keys(req.body),
      serviceEndpoint,
      req.body,
      signature
    );

    // 🔐 Encrypt the VC before storing it on IPFS
    const encryptedVC = encryptWithPublicKey(
      publicKey,
      JSON.stringify(verifiableCredential)
    );

    // 🌐 Upload to Pinata IPFS
    try {
      // Create a readable stream from the encrypted VC data (which is a JSON object)
      const bufferStream = stream.Readable.from(
        Buffer.from(JSON.stringify(encryptedVC))
      );

      // Pin the file to Pinata
      const pinataResponse = await pinata.pinFileToIPFS(bufferStream, {
        pinataMetadata: {
          name: "verifiable-credential", // Customize the name of your file
        },
        pinataOptions: {
          cidVersion: 0, // Use the IPFS v0 CID version
        },
      });

      const ipfsCID = pinataResponse.IpfsHash; // Retrieve the IPFS CID (hash)

      console.log("File pinned to IPFS with CID:", ipfsCID);

      // Compute 32-byte hash for credential
      const credentialHash = ethers.keccak256(
        ethers.toUtf8Bytes(JSON.stringify(req.body))
      );

      const txHash = ethers.hexlify(ethers.randomBytes(32)); // Dummy transaction hash
      const issuedAt = new Date().toISOString();
      const expiresAt = new Date(
        new Date().setFullYear(new Date().getFullYear() + 2)
      ).toISOString();

      console.log("Storing credential:", credentialHash);

      // Send transaction to blockchain
      try {
        const tx = await contract.issueCredential(
          txHash,
          credentialHash,
          signature,
          issuedAt,
          expiresAt,
          ipfsCID
        );
        await tx.wait();
      } catch (err) {
        console.error("Blockchain transaction failed:", err);
        res
          .status(500)
          .json({ status: "failed", msg: "Blockchain transaction failed" });
        return;
      }

      console.log("Stored credential on-chain with hash:", credentialHash);

      res.status(200).json({
        status: "success",
        msg: "Credential issued successfully",
        data: {
          vc: verifiableCredential,
          jwt: credentialJWT,
          credentialHash,
        },
      });
    } catch (err) {
      console.error("IPFS Upload to Pinata failed:", err);
      res
        .status(500)
        .json({ status: "failed", msg: "Failed to upload to IPFS" });
    }
  } catch (error) {
    next(error);
  }
};
export const verifyCredential = (req: Request, res: Response) => {
  const { credentialJWT, vc } = req.body;

  try {
    const publicKey = vc.publicKey;
    const isValidCredential = verifyCredentialJWT(publicKey, credentialJWT);

    if (!isValidCredential) {
      res.status(400).json({ status: "failed", msg: "Credential is invalid" });
    }

    res.status(200).json({
      status: "success",
      msg: "Credential verified successfully",
    });
  } catch (error) {
    res.status(500).json({ status: "failed", msg: "Credential is invalid" });
  }
};

export const getCredentials = async (req: Request, res: Response) => {
  try {
    // Fetch all credential hashes from the contract
    const credentialHashes: string[] = await contract.getAllCredentialHashes();

    // Fetch the details for each credential using the hashes
    const credentials = await Promise.all(
      credentialHashes.map(async (hash) => {
        // Retrieve detailed information about each credential
        const [
          txHash,
          issuerDID,
          holderDID,
          ipfsCID,
          status,
          signature,
          issuedAt,
          expiresAt,
        ] = await contract.getCredentialDetails(hash);

        // Return the credential object with all the relevant fields
        return {
          credentialHash: hash,
          txHash,
          issuerDID,
          holderDID,
          ipfsCID,
          status,
          proof: {
            signature,
            issuedAt,
            expiresAt,
          },
        };
      })
    );

    // Send the response with all the credentials
    res.status(200).json({ status: "success", data: credentials });
  } catch (error) {
    console.error("Error fetching credentials:", error);
    res
      .status(500)
      .json({ status: "error", message: "Failed to fetch credentials" });
  }
};

export const revokeCredential = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    try {
      const { vcHash } = req.body;

      if (!vcHash) {
        return res
          .status(400)
          .json({ success: false, message: "vcHash is required" });
      }

      const tx = await contract.revokeCredential(vcHash);
      await tx.wait(); // Wait for transaction confirmation

      res.json({
        success: true,
        message: "Credential revoked",
        txHash: tx.hash,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error revoking credential",
        error: (error as Error).message,
      });
    }
  } catch (error) {
    next(error);
  }
};
