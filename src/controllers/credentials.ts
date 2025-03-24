import { NextFunction, Request, Response } from "express";
import { credentialValidator } from "../middlewares/validator";
import { signWithHSM } from "../utils/signwithHSM";
import db from "../dbConfig";
import { vcBuilder } from "../utils/vcBuilder";
import { verifyCredentialJWT } from "../utils/verifyHSM";
import { computeCredentialHash } from "../utils/computeCredentialHash";
import contractABI from "../../artifacts/contracts/visaCredential.sol/VisaCredentialRegistry.json";
import { ethers } from "ethers";

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

export const issueCredential = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const {
    visaID,
    firstName,
    lastName,
    dateOfBirth,
    nationality,
    passportNumber,
    passportExpiryDate,
    gender,
    placeOfBirth,
  } = req.body;

  try {
    const { error, value } = credentialValidator.validate({
      visaID,
      firstName,
      lastName,
      dateOfBirth,
      nationality,
      passportNumber,
      passportExpiryDate,
      gender,
      placeOfBirth,
    });

    if (error) {
      res.status(400).json({ status: "failed", msg: error.details[0].message });
    }

    const getPrivateKeyQuery = `SELECT keys FROM immigration`;
    const getPrivateKeyResult = await db.query(getPrivateKeyQuery);
    const keys = getPrivateKeyResult.rows[0].keys;
    const privatekey = keys.privateKey;
    const publicKey = keys.publicKey;

    const serviceEndpoint = process.env.UKVI_ENDPOINT || `http://api.ukvi.com`;

    const { signature, credentialJWT } = signWithHSM(privatekey, req.body);

    const verifiableCredential = vcBuilder(
      publicKey,
      Object.keys(req.body),
      serviceEndpoint,
      req.body,
      signature
    );

    // Compute Hash of minimal VC data
    const credentialHash = computeCredentialHash(req.body);

    console.log(credentialHash);

    const tx = await contract.issueCredential(
      `0x${credentialHash}`,
      visaID,
      passportExpiryDate,
      "did:dev:969535dbe772594c5adc6155ce26a9eb" // Hardcoded for now
    );
    console.log("hello00");
    await tx.wait();

    console.log("Stored credential on-chain with hash:", credentialHash);

    res.status(200).json({
      status: "success",
      msg: "Credential signed successfully",
      data: { vc: verifiableCredential, jwt: credentialJWT, credentialHash },
    });
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
    const credentialHashes: string[] = await contract.getAllCredentials();

    const credentials = await Promise.all(
      credentialHashes.map(async (hash) => {
        const details = await contract.getCredentialDetails(hash);
        return {
          credentialHash: hash,
          visaID: details[0],
          validUntil: details[1],
          applicantDID: details[2],
          issuerDID: details[3],
          issued: details[4],
        };
      })
    );

    res.status(200).json({ status: "success", data: credentials });
  } catch (error) {
    console.error("Error fetching credentials:", error);
    res
      .status(500)
      .json({ status: "error", message: "Failed to fetch credentials" });
  }
};
