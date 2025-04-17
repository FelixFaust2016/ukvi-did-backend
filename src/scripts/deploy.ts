import { ethers } from "hardhat";

async function main() {
    // Get contract factory
    const VisaCredential = await ethers.getContractFactory("VisaCredentialContractRegistry");

    // Deploy contract
    const visaContract = await VisaCredential.deploy();
    await visaContract.waitForDeployment(); // Correct method

    // Get the deployed contract address
    const contractAddress = await visaContract.getAddress();
    
    console.log("Contract deployed to:", contractAddress);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error deploying contract:", error);
        process.exit(1);
    });
