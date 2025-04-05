require('dotenv').config();
// require("@nomiclabs/hardhat-ethers");
// require("@nomiclabs/hardhat-etherscan");

module.exports = {
    defaultNetwork: "polygon_amoy",
    networks: {
        hardhat: {
        },
        polygon_amoy: {
            url: "https://rpc-amoy.polygon.technology",
            accounts: [process.env.PRIVATE_KEY]
        },
        alfajores: {
            url: "https://alfajores-forno.celo-testnet.org",
            accounts: [
                process.env.PRIVATE_KEY
            ],
        },
        celo: {
            url: "https://forno.celo.org",
            accounts: [
                process.env.PRIVATE_KEY
            ],
        }
    },
    etherscan: {
        apiKey: process.env.NEXT_PUBLIC_POLYGONSCAN_API_KEY,
        apiKey: {
            alfajores: process.env.NEXT_PUBLIC_CELOSCAN_API_KEY,
            celo: process.env.NEXT_PUBLIC_CELOSCAN_API_KEY
        },
        customChains: [
            {
                network: "alfajores",
                chainId: 44787,
                urls: {
                    apiURL: "https://api-alfajores.celoscan.io/api",
                    browserURL: "https://alfajores.celoscan.io",
                },
            },
            {
                network: "celo",
                chainId: 42220,
                urls: {
                    apiURL: "https://api.celoscan.io/api",
                    browserURL: "https://celoscan.io/",
                },
            },
        ]
    },
    solidity: {
        version: "0.8.20",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
    },
}
