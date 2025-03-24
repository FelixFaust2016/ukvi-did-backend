import { ethers } from "ethers";
import contractABI from "../../artifacts/contracts/visaCredential.sol/VisaCredentialRegistry.json";
import dotenv from "dotenv";

dotenv.config();

// Ensure that PRIVATE_KEY is present in environment variables
if (!process.env.PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY is not defined in the .env file");
}

// Ensure that CONTRACT_ADDRESS is defined
if (!process.env.CONTRACT_ADDRESS) {
    throw new Error("CONTRACT_ADDRESS is not defined in the .env file");
}


const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI.abi, wallet);

export default contract;
