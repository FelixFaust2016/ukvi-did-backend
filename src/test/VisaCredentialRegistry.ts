import { expect } from "chai";
import { ethers } from "hardhat";
import { VisaCredentialRegistry } from "../../typechain-types"; // Ensure correct contract type import

describe("VisaCredentialRegistry Contract", function () {
  let visaCredentialRegistry: VisaCredentialRegistry;
  let owner: any;
  let addr1: any;
  let addr2: any;

  beforeEach(async function () {
    // Get the contract factory
    const VisaCredentialRegistryFactory = await ethers.getContractFactory("VisaCredentialRegistry");

    // Get signers
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy the contract
    visaCredentialRegistry = (await VisaCredentialRegistryFactory.deploy()) as VisaCredentialRegistry;

    // Ensure contract is deployed
    await visaCredentialRegistry.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right issuer", async function () {
      const issuer = await visaCredentialRegistry.issuer();
      expect(issuer).to.equal(await owner.getAddress());
    });
  });

  // Additional tests...
});
