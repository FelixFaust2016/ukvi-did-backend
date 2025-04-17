import { Response, Request, NextFunction } from "express";
import contractABI from "../../artifacts/contracts/visaCredentialContract.sol/VisaCredentialContractRegistry.json";
import { ethers } from "ethers";

if (!process.env.PRIVATE_KEY) {
  throw new Error("PRIVATE_KEY is not defined in the .env file");
}

if (!process.env.CONTRACT_ADDRESS) {
  throw new Error("CONTRACT_ADDRESS is not defined in the .env file");
}

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  contractABI.abi,
  wallet
);

export const getDashboardData = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    try {
      const credentialHashes: string[] =
        await contract.getAllCredentialHashes();
      const counts = { unclaimed: 0, claimed: 0, revoked: 0 };

      for (const hash of credentialHashes) {
        const status: string = (await contract.getCredentialDetails(hash))[4];
        if (status in counts) {
            counts[status as keyof typeof counts]++;
        }
      }

      res.json({ success: true, data: counts });
    } catch (error) {
      res
        .status(500)
        .json({
          success: false,
          message: "Error fetching credential counts",
          error: (error as Error).message,
        });
    }
  } catch (error) {
    next(error);
  }
};
