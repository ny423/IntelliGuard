import { ContractInput } from '../types/contract';

// Function to fetch contract source code from Et   herscan
// export const getContractSourceCode = async (address: string, network: string = 'sepolia') => {
//     // API key - in a production app, this should be in environment variables
//     const apiKey = 'U3K1NHZ7MSMBVP3MYFRDGH3BSCKT44FH4G';

//     // Determine API URL based on network
//     let apiBaseUrl = 'https://api.etherscan.io';
//     if (network === 'sepolia') {
//         apiBaseUrl = 'https://api-sepolia.etherscan.io';
//     } else if (network === 'goerli') {
//         apiBaseUrl = 'https://api-goerli.etherscan.io';
//     }

//     const url = `${apiBaseUrl}/api?module=contract&action=getsourcecode&address=${address}&apikey=${apiKey}`;

//     try {
//         const response = await fetch(url);
//         const data = await response.json() as EtherscanAbiResponse;

//         if (data.status === '0') {
//             // Handle error cases like unverified contracts
//             return {
//                 success: false,
//                 contractAddress: address,
//                 network,
//                 result: {
//                     SourceCode: 'Contract not found/unverified',
//                 },
//                 isVerified: false,
//             };
//         }

//         return {
//             success: true,
//             contractAddress: address,
//             network,
//             result: data.result,
//             isVerified: true,
//         };
//     } catch (error) {
//         return {
//             success: false,
//             network,
//             contractAddress: address,
//             result: {
//                 SourceCode: JSON.stringify(error),
//             },
//             isVerified: false,
//         };
//     }
// };

// Add validation utilities
export const isValidAddress = (address: string): boolean => {
    // Check if it's a proper Ethereum address format
    return /^0x[0-9a-fA-F]{40}$/.test(address);
};

export const isValidUint = (value: string): boolean => {
    // Check if it's a valid unsigned integer
    return /^\d+$/.test(value);
};

export const isValidInt = (value: string): boolean => {
    // Check if it's a valid integer (can be negative)
    return /^-?\d+$/.test(value);
};

// Function to validate a single parameter based on its type
export const validateParam = (type: string, value: string): { isValid: boolean; error: string | null } => {
    // For empty optional values
    if (!value.trim()) {
        return { isValid: true, error: null };
    }

    // Handle array types
    if (type.endsWith('[]')) {
        const baseType = type.slice(0, -2);
        const values = value.split(',').map(v => v.trim());

        // Check each value in the array
        for (const item of values) {
            const validation = validateParam(baseType, item);
            if (!validation.isValid) {
                return validation;
            }
        }
        return { isValid: true, error: null };
    }

    // Handle individual types
    if (type === 'address') {
        if (!isValidAddress(value)) {
            return {
                isValid: false,
                error: `Invalid address: "${value}". Address must be 42 characters long (0x + 40 hex characters).`
            };
        }
    } else if (type.startsWith('uint')) {
        if (!isValidUint(value)) {
            return {
                isValid: false,
                error: `Invalid uint: "${value}". Must be a positive integer.`
            };
        }
    } else if (type.startsWith('int')) {
        if (!isValidInt(value)) {
            return {
                isValid: false,
                error: `Invalid int: "${value}". Must be an integer.`
            };
        }
    } else if (type === 'bool') {
        if (value.toLowerCase() !== 'true' && value.toLowerCase() !== 'false') {
            return {
                isValid: false,
                error: `Invalid boolean: "${value}". Must be "true" or "false".`
            };
        }
    }

    return { isValid: true, error: null };
};

// Function to validate all parameters for a function
export const validateInputs = (
    inputs: ContractInput[],
    inputValues: Record<string, string>
): { isValid: boolean; error: string | null } => {
    for (const input of inputs) {
        const value = inputValues[input.name || `param${input.type}`] || '';
        const validation = validateParam(input.type, value);

        if (!validation.isValid) {
            return validation;
        }
    }

    return { isValid: true, error: null };
};

// Function to prepare arguments for transaction based on input types
export const prepareArgs = (inputs: ContractInput[], inputValues: Record<string, string>): readonly (string | number | bigint | boolean | `0x${string}`)[] => {
    const result: (string | number | bigint | boolean | `0x${string}`)[] = [];

    for (const input of inputs) {
        const paramName = input.name || `param${input.type}`;
        const value = inputValues[paramName] || '';

        // Check if the type is an array (ends with [])
        const isArray = input.type.endsWith('[]');

        if (isArray) {
            // For array inputs
            if (!value.trim()) {
                // For empty arrays, Viem needs us to pass an empty array
                // But we can't directly push an array into our result array
                // So for now, we'll just add a placeholder
                // We'll need to handle this in the calling code
                result.push('[]' as string);
            } else {
                // Split by comma and process each value
                const arrayValues = value.split(',').map(item => item.trim());
                const baseType = input.type.slice(0, -2); // Remove [] to get base type

                // Since we can't add an array directly to our result (TypeScript type constraints),
                // we'll add a special string format that we'll parse in TransactionDemo
                const processedArrayString = arrayValues.map(item => {
                    if (baseType === 'address') {
                        return item; // Leave as string for now
                    } else if (baseType.startsWith('uint') || baseType.startsWith('int')) {
                        return item; // Leave as string for now
                    } else if (baseType === 'bool') {
                        return item.toLowerCase();
                    } else {
                        return item;
                    }
                }).join('|||'); // Use a special separator that's unlikely to appear in values

                // Add a special prefix so we know this is an array in string form
                result.push(`__ARRAY__:${baseType}:${processedArrayString}` as string);
            }
        } else {
            // For non-array inputs
            if (!value.trim()) {
                // Default values for empty inputs
                if (input.type === 'address') {
                    result.push('0x0000000000000000000000000000000000000000' as `0x${string}`);
                } else if (input.type.startsWith('uint') || input.type.startsWith('int')) {
                    result.push(BigInt(0));
                } else if (input.type === 'bool') {
                    result.push(false);
                } else {
                    result.push('');
                }
            } else {
                // Convert based on type
                if (input.type === 'address') {
                    result.push(value as `0x${string}`);
                } else if (input.type.startsWith('uint') || input.type.startsWith('int')) {
                    result.push(BigInt(value));
                } else if (input.type === 'bool') {
                    result.push(value.toLowerCase() === 'true');
                } else {
                    result.push(value);
                }
            }
        }
    }

    return result;
}; 