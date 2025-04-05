import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// EtherscanABI Response Interface
interface EtherscanAbiResponse {
    status: string;
    message: string;
    result: {
        SourceCode: string;
        ABI: string;
        ContractName: string;
        CompilerVersion: string;
        OptimizationUsed: string;
        Runs: string;
        ConstructorArguments: string;
        EVMVersion: string;
        Library: string;
        LicenseType: string;
        Proxy: string;
        Implementation: string;
        SwarmSource: string;
    }[];
}

export const contractAbiTool = createTool({
    id: 'get-contract-abi',
    description: 'Fetch the ABI for an Ethereum smart contract',
    inputSchema: z.object({
        address: z.string().describe('Ethereum contract address'),
        network: z.enum(['mainnet', 'sepolia', 'celo', 'celoAlfajores', 'polygon', 'polygonAmoy']).default('sepolia').describe('Ethereum network'),
    }),
    outputSchema: z.object({
        success: z.boolean(),
        contractAddress: z.string(),
        network: z.string(),
        SourceCode: z.string(),
        abi: z.string(),
        isVerified: z.boolean(),
    }),
    execute: async ({ context }) => {
        return await getContractSourceCode(context.address, context.network);
    },
});

export const getContractSourceCode = async (address: string, network: string = 'sepolia') => {
    let apiKey = process.env.ETHERSCAN_API_KEY;
    if (network === 'polygon' || network === 'polygonAmoy') {
        apiKey = process.env.POLYGONSCAN_API_KEY;
    }
    else if (network === 'celo' || network === 'celoAlfajores') {
        apiKey = process.env.CELOSCAN_API_KEY;
    }

    if (!apiKey) {
        throw new Error(`API key not found for network: ${network}`);
    }

    // Determine API URL based on network
    let apiBaseUrl = 'https://api.etherscan.io';
    if (network === 'sepolia') {
        apiBaseUrl = 'https://api-sepolia.etherscan.io';
    }
    else if (network === 'polygon') {
        apiBaseUrl = 'https://api.polygonscan.com';
    }
    else if (network === 'polygonAmoy') {
        apiBaseUrl = 'https://api-amoy.polygonscan.com';
    }
    else if (network === 'celo') {
        apiBaseUrl = 'https://api.celoscan.io';
    }
    else if (network === 'celoAlfajores') {
        apiBaseUrl = 'https://api-alfajores.celoscan.io';
    }

    const url = `${apiBaseUrl}/api?module=contract&action=getsourcecode&address=${address}&apikey=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json() as EtherscanAbiResponse;
        console.log("🚀 ~ getContractSourceCode ~ data:", data);
        if (data.status === '0') {
            // Handle error cases like unverified contracts
            return {
                success: false,
                contractAddress: address,
                network,
                SourceCode: 'Contract not found/unverified',
                abi: '',
                isVerified: false,
            };
        }

        return {
            success: true,
            contractAddress: address,
            network,
            SourceCode: data.result[0].SourceCode,
            abi: data.result[0].ABI,
            isVerified: true,
        };
    } catch (error) {
        console.error('Error fetching contract source code:', error);
        return {
            success: false,
            network,
            contractAddress: address,
            SourceCode: JSON.stringify(error),
            abi: '',
            isVerified: false,
        };
    }
    // }
    // else if (network === 'celo' || network === 'celoAlfajores') {
    //     // Determine API URL based on network
    //     let apiBaseUrl = 'https://celo.blockscout.com';
    //     if (network === 'celoAlfajores') {
    //         apiBaseUrl = 'https://celo-alfajores.blockscout.com';
    //     }

    //     const url = `${apiBaseUrl}/api/v2/smart-contracts/${address}`;

    //     try {
    //         const response = await fetch(url);
    //         const data = await response.json() as CeloscanAbiResponse;
    //         console.log("🚀 ~ getContractSourceCode ~ celo data:", data)
    //         if (!!data.source_code && data.source_code.length > 0) {
    //             return {
    //                 success: true,
    //                 contractAddress: address,
    //                 network,
    //                 SourceCode: data.source_code,
    //                 abi: data.abi,
    //                 isVerified: true,
    //             };
    //         }
    //         else if (data.implementations.length > 0) {
    //             const response = await fetch(`${apiBaseUrl}/api/v2/smart-contracts/${data.implementations[0].address}`);
    //             const refetchedData = await response.json() as CeloscanAbiResponse;

    //             if (!!refetchedData.source_code && refetchedData.source_code.length > 0) {
    //                 return {
    //                     success: true,
    //                     contractAddress: address,
    //                     network,
    //                     SourceCode: refetchedData.source_code,
    //                     abi: refetchedData.abi,
    //                     isVerified: true,
    //                 };
    //             }
    //             else {
    //                 return {
    //                     success: false,
    //                     contractAddress: address,
    //                     network,
    //                     SourceCode: 'Contract not found/unverified',
    //                     abi: '',
    //                     isVerified: false,
    //                 };
    //             }
    //         }
    //         else {
    //             return {
    //                 success: true,
    //                 contractAddress: address,
    //                 network,
    //                 SourceCode: data.source_code,
    //                 abi: data.abi,
    //                 isVerified: true,
    //             };
    //         }
    //     } catch (error) {
    //         console.error('Error fetching contract source code:', error);
    //         return {
    //             success: false,
    //             network,
    //             contractAddress: address,
    //             SourceCode: JSON.stringify(error),
    //             abi: '',
    //             isVerified: false,
    //         };
    //     }
    // }
    // else {
    //     throw new Error('Unsupported network');
    // }
}; 