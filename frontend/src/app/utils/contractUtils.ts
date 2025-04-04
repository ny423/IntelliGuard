import { EtherscanAbiResponse, ContractInput } from '../types/contract';

// Function to fetch contract source code from Et   herscan
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
            result: data.result,
            isVerified: true,
        };
    } catch (error) {
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

// Function to display transaction data in a window
export const openTransactionDataWindow = (data: string) => {
    // Calculate position for top right corner
    const screenWidth = window.screen.width;
    const windowWidth = 600;
    const windowHeight = 400;
    const left = screenWidth - windowWidth - 20; // 20px margin from right edge
    const top = 20; // 20px from top

    const newWindow = window.open('', '_blank', `width=${windowWidth},height=${windowHeight},left=${left},top=${top}`);
    if (newWindow) {
        newWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Transaction Data</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #1f2937;
                        color: #e5e7eb;
                        padding: 20px;
                        margin: 0;
                    }
                    h2 {
                        color: white;
                        margin-top: 0;
                    }
                    .data-container {
                        background-color: #374151;
                        padding: 16px;
                        border-radius: 8px;
                        word-break: break-all;
                        white-space: pre-wrap;
                        overflow-y: auto;
                        max-height: 300px;
                        font-family: monospace;
                    }
                </style>
            </head>
            <body>
                <h2>Transaction Data</h2>
                <div class="data-container">${data}</div>
            </body>
            </html>
        `);
        newWindow.document.close();
    }
};

// Function to prepare arguments for transaction based on input types
export const prepareArgs = (inputs: ContractInput[], inputValues: Record<string, string>) => {
    return inputs.map(input => {
        const value = inputValues[input.name || `param${input.type}`] || '';

        // Handle different input types
        if (input.type === 'address') {
            return value as `0x${string}`;
        } else if (input.type.startsWith('uint') || input.type.startsWith('int')) {
            return value ? BigInt(value) : BigInt(0);
        } else if (input.type === 'bool') {
            return value.toLowerCase() === 'true';
        } else {
            return value;
        }
    });
};

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