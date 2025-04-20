const hre = require("hardhat");

async function main() {
  // Deploy UserManager
  const UserManager = await hre.ethers.getContractFactory("UserManager");
  const userManager = await UserManager.deploy();
  console.log("UserManager deploying to:", userManager.target);
  await userManager.waitForDeployment();
  console.log("UserManager deployed to:", await userManager.getAddress());

  // Deploy LandRegistry with UserManager address
  const LandRegistry = await hre.ethers.getContractFactory("LandRegistry");
  const landRegistry = await LandRegistry.deploy(await userManager.getAddress());
  console.log("LandRegistry deploying to:", landRegistry.target);
  await landRegistry.waitForDeployment();
  console.log("LandRegistry deployed to:", await landRegistry.getAddress());

  // Transfer ownership of UserManager to LandRegistry
  const tx = await userManager.transferOwnership(await landRegistry.getAddress());
  await tx.wait();
  console.log("UserManager ownership transferred to LandRegistry");

  // Save contract addresses to config file
  const fs = require('fs');
  const configPath = './frontend/src/config.js';
  const configContent = `export const WHAT3WORDS_API_KEY = '${process.env.WHAT3WORDS_API_KEY || 'YOUR_API_KEY_HERE'}';

export const CONTRACT_ADDRESSES = {
  UserManager: '${await userManager.getAddress()}',
  LandRegistry: '${await landRegistry.getAddress()}',
};
`;

  fs.writeFileSync(configPath, configContent);
  console.log("Contract addresses saved to config.js");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
