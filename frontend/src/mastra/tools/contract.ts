import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// EtherscanABI Response Interface
interface EtherscanAbiResponse {
    status: string;
    message: string;
    result: string;
}

export const contractAbiTool = createTool({
    id: 'get-contract-abi',
    description: 'Fetch the ABI for an Ethereum smart contract',
    inputSchema: z.object({
        address: z.string().describe('Ethereum contract address'),
        network: z.enum(['mainnet', 'sepolia', 'goerli']).default('sepolia').describe('Ethereum network'),
    }),
    outputSchema: z.object({
        success: z.boolean(),
        contractAddress: z.string(),
        network: z.string(),
        result: z.object({
            SourceCode: z.string(),
        }),
        isVerified: z.boolean(),
    }),
    execute: async ({ context }) => {
        return await getContractSourceCode(context.address, context.network);
    },
});

export const getContractSourceCode = async (address: string, network: string = 'sepolia') => {
    // API key - in a production app, this should be in environment variables
    const apiKey = 'U3K1NHZ7MSMBVP3MYFRDGH3BSCKT44FH4G';

    // Determine API URL based on network
    let apiBaseUrl = 'https://api.etherscan.io';
    if (network === 'sepolia') {
        apiBaseUrl = 'https://api-sepolia.etherscan.io';
    } else if (network === 'goerli') {
        apiBaseUrl = 'https://api-goerli.etherscan.io';
    }

    const url = `${apiBaseUrl}/api?module=contract&action=getsourcecode&address=${address}&apikey=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json() as EtherscanAbiResponse;

        if (data.status === '0') {
            // Handle error cases like unverified contracts
            return {
                success: false,
                contractAddress: address,
                network,
                result: {
                    SourceCode: 'Contract not found/unverified',
                },
                isVerified: false,
            };
        }

        return {
            success: true,
            contractAddress: address,
            network,
            result: {
                SourceCode: data.result,
            },
            isVerified: true,
        };
    } catch (error) {
        console.error('Error fetching contract source code:', error);
        return {
            success: false,
            network,
            contractAddress: address,
            result: {
                SourceCode: JSON.stringify(error),
            },
            isVerified: false,
        };
    }
}; 