// const hre = require("hardhat");
import { ethers } from "hardhat";

async function main() {
    const OwnableContract = await ethers.getContractFactory("OwnableContract");
    const contract = await OwnableContract.deploy();

    await contract.waitForDeployment();

    console.log("OwnableContract deployed to:", await contract.getAddress());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 