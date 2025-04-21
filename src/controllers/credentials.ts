import { NextFunction, Request, Response } from "express";
import { credentialValidator } from "../middlewares/validator";
import { signWithHSM } from "../utils/signwithHSM";
import db from "../dbConfig";
import { vcBuilder } from "../utils/vcBuilder";
import { verifyCredentialJWT } from "../utils/verifyHSM";
import contractABI from "../../artifacts/contracts/visaCredentialContract.sol/VisaCredentialContractRegistry.json";
import { ethers } from "ethers";
import stream from "stream";
import pinataSDK from "@pinata/sdk";
import { encryptWithPublicKey } from "../utils/encryptWithPublicKey";

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

export const issueCredential = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { subjectDid } = req.body;

  try {
    // Validate request body
    const { error } = credentialValidator.validate(req.body);
    if (error) {
      res.status(400).json({ status: "failed", msg: error.details[0].message });
      return;
    }

    //get public key using subjectDID
    const getSubjectPuplicKey = await db.query(
      "SELECT publicKey FROM applicants WHERE did = $1",
      [subjectDid]
    );

    const subjectPublicKey = getSubjectPuplicKey.rows[0].publickey;

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
      subjectDid,
      Object.keys(req.body),
      serviceEndpoint,
      req.body,
      signature
    );

    // 🔐 Encrypt the VC before storing it on IPFS
    const encryptedVC = encryptWithPublicKey(
      JSON.stringify(verifiableCredential),
      subjectPublicKey
    );

    console.log("hdhdhdhdhje.");
    console.log("====================================");
    console.log(encryptedVC);
    console.log("====================================");

    // 🌐 Upload to Pinata IPFS
    try {
      // Create a readable stream from the encrypted VC data (which is a JSON object)
      const bufferStream = stream.Readable.from(
        Buffer.from(JSON.stringify(encryptedVC))
      );

      // Pin the file to Pinata
      const pinataResponse = await pinata.pinFileToIPFS(bufferStream, {
        pinataMetadata: {
          name: `vc-${Date.now()}.json`, // Customize the name of your file
        },
        pinataOptions: {
          cidVersion: 1, // Use the IPFS v0 CID version
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
          ipfsCID,
          "did:dev:969535dbe772594c5adc6155ce26a9eb",
          publicKey,
          issuedAt,
          expiresAt
        );
        await tx.wait();

        //update txh of applicant
        const updateApplicantQuery = `UPDATE applicants SET txh=$2 WHERE did = $1 RETURNING *`;
        const updateApplicantResult = await db.query(updateApplicantQuery, [
          subjectDid,
          txHash,
        ]);
        console.log("====================================");
        console.log(updateApplicantResult.rows[0]);
        console.log("====================================");
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
          vcHash,
          ipfsCID,
          issuerDID,
          issuerPublicKey,
          issuedAt,
          expiresAt,
          status,
        ] = await contract.getCredentialDetails(hash);

        // Return the credential object with all the relevant fields
        return {
          credentialHash: hash,
          txHash,
          vcHash,
          ipfsCID,
          issuerDID,
          issuerPublicKey,
          issuedAt,
          expiresAt,
          status,
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
        msg: "Error revoking credential",
        error: (error as Error).message,
      });
    }
  } catch (error) {
    next(error);
  }
};
