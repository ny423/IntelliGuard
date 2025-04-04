'use client';

import { useState, useEffect, JSX } from 'react';
import { useAccount } from 'wagmi';
import { useTransactionHook } from '../hooks/useTransactionHook';

// Define proper types for ABI items
interface ContractInput {
    name: string;
    type: string;
    indexed?: boolean;
    components?: Array<ContractInput>;
    internalType?: string;
}

interface ContractOutput {
    name: string;
    type: string;
    components?: Array<ContractOutput>;
    internalType?: string;
}

interface ContractFunction {
    name: string;
    type: string;
    inputs: Array<ContractInput>;
    outputs?: Array<ContractOutput>;
    stateMutability?: string;
    constant?: boolean;
    payable?: boolean;
}

// Define the Etherscan ABI response interface
interface EtherscanAbiItem {
    name?: string;
    type: string;
    inputs?: ContractInput[];
    outputs?: ContractOutput[];
    stateMutability?: string;
    constant?: boolean;
    payable?: boolean;
}

interface EtherscanSourceCodeItem {
    ABI: string;
    ContractName: string;
    CompilerVersion: string;
    OptimizationUsed: string;
    SourceCode: string;
    [key: string]: unknown;
}

interface EtherscanAbiResponse {
    status: string;
    message: string;
    result: EtherscanSourceCodeItem[] | string;
}

// Function to fetch contract source code from Etherscan
const getContractSourceCode = async (address: string, network: string = 'sepolia') => {
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

// Component to display a single function
interface FunctionItemProps {
    func: ContractFunction;
    isSelected: boolean;
    onSelect: () => void;
}

const FunctionItem: React.FC<FunctionItemProps> = ({ func, isSelected, onSelect }) => (
    <div className={`p-2 border-b border-gray-700 last:border-b-0 ${isSelected ? 'bg-gray-800' : ''}`}>
        <div className="font-medium text-green-400">
            {func.name}
            <span className="text-gray-400 text-sm ml-2">
                ({func.stateMutability || 'nonpayable'})
            </span>
        </div>

        <div className="text-sm text-gray-300">
            Inputs: {func.inputs.length ?
                func.inputs.map(input => `${input.name || 'param'} (${input.type})`).join(', ') :
                'None'}
        </div>

        {func.outputs && (
            <div className="text-sm text-gray-300">
                Outputs: {func.outputs.length ?
                    func.outputs.map(output => `${output.name || 'return'} (${output.type})`).join(', ') :
                    'None'}
            </div>
        )}

        <button
            className={`mt-2 px-3 py-1 text-sm ${isSelected ? 'bg-green-700' : 'bg-gray-700'} text-white rounded hover:bg-gray-600 transition-colors`}
            onClick={onSelect}
        >
            {isSelected ? 'Selected' : 'Use This Function'}
        </button>
    </div>
);

// Component to display function parameters input form
interface FunctionParamsProps {
    selectedFunction: ContractFunction;
    inputValues: Record<string, string>;
    onInputChange: (name: string, value: string) => void;
    amount: string;
    onAmountChange: (value: string) => void;
}

const FunctionParams: React.FC<FunctionParamsProps> = ({
    selectedFunction,
    inputValues,
    onInputChange,
    amount,
    onAmountChange
}) => (
    <div className="space-y-3 mb-4">
        {selectedFunction.inputs.length > 0 ? (
            selectedFunction.inputs.map((input, idx) => (
                <div key={idx}>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                        {input.name || `Parameter ${idx + 1}`} <span className="text-gray-400">({input.type})</span>
                    </label>
                    <input
                        type="text"
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white"
                        placeholder={`Enter ${input.type} value`}
                        value={inputValues[input.name || `param${input.type}`] || ''}
                        onChange={(e) => onInputChange(input.name || `param${input.type}`, e.target.value)}
                    />
                </div>
            ))
        ) : (
            <p className="text-gray-300">This function takes no parameters.</p>
        )}

        {selectedFunction.stateMutability === 'payable' && (
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                    ETH Value to Send
                </label>
                <input
                    type="text"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white"
                    placeholder="Amount in ETH"
                    value={amount}
                    onChange={(e) => onAmountChange(e.target.value)}
                />
            </div>
        )}
    </div>
);

// Component to display the contract exploration UI
interface ContractExplorerProps {
    network: 'mainnet' | 'sepolia' | 'goerli';
    onNetworkChange: (network: 'mainnet' | 'sepolia' | 'goerli') => void;
    contractAddress: string;
    onAddressChange: (address: string) => void;
    isLoading: boolean;
    error: string | null;
    functions: ContractFunction[];
    selectedFunction: ContractFunction | null;
    onSelectFunction: (func: ContractFunction) => void;
    onFetchABI: () => void;
}

const ContractExplorer: React.FC<ContractExplorerProps> = ({
    network,
    onNetworkChange,
    contractAddress,
    onAddressChange,
    isLoading,
    error,
    functions,
    selectedFunction,
    onSelectFunction,
    onFetchABI
}) => (
    <div className="border-b border-gray-700 pb-6 mb-6">
        <h3 className="text-xl font-semibold text-white mb-4">Contract Explorer</h3>

        <div className="flex space-x-2 mb-4">
            <select
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white flex-shrink-0"
                value={network}
                onChange={(e) => onNetworkChange(e.target.value as 'mainnet' | 'sepolia' | 'goerli')}
            >
                <option value="mainnet">Mainnet</option>
                <option value="sepolia">Sepolia</option>
                <option value="goerli">Goerli</option>
            </select>

            <input
                type="text"
                className="flex-grow px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                placeholder="Contract Address (0x...)"
                value={contractAddress}
                onChange={(e) => onAddressChange(e.target.value)}
            />

            <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex-shrink-0"
                onClick={onFetchABI}
                disabled={isLoading}
            >
                {isLoading ? 'Loading...' : 'Explore'}
            </button>
        </div>

        {error && (
            <div className="p-3 bg-red-900 bg-opacity-50 rounded-md text-red-200 mb-4">
                {error}
            </div>
        )}

        {functions.length > 0 && (
            <div>
                <h4 className="text-lg font-medium text-white mb-2">Available Functions:</h4>
                <div className="max-h-64 overflow-y-auto bg-gray-900 rounded-md p-2">
                    {functions.map((func, index) => (
                        <FunctionItem
                            key={index}
                            func={func}
                            isSelected={selectedFunction?.name === func.name}
                            onSelect={() => onSelectFunction(func)}
                        />
                    ))}
                </div>
            </div>
        )}
    </div>
);

// Component to display the contract interaction form
interface ContractInteractionFormProps {
    selectedFunction: ContractFunction | null;
    contractAddress: string;
    inputValues: Record<string, string>;
    onInputChange: (name: string, value: string) => void;
    amount: string;
    onAmountChange: (value: string) => void;
    onExecute: () => void;
    isDisabled: boolean;
}

const ContractInteractionForm: React.FC<ContractInteractionFormProps> = ({
    selectedFunction,
    contractAddress,
    inputValues,
    onInputChange,
    amount,
    onAmountChange,
    onExecute,
    isDisabled
}) => {
    if (!selectedFunction) return null;

    return (
        <div className="mb-6 p-4 bg-gray-700 rounded-lg">
            <h3 className="text-xl font-semibold text-white mb-4">
                Contract Interaction: <span className="text-green-400">{selectedFunction.name}</span>
            </h3>

            <FunctionParams
                selectedFunction={selectedFunction}
                inputValues={inputValues}
                onInputChange={onInputChange}
                amount={amount}
                onAmountChange={onAmountChange}
            />

            <div className="text-sm text-gray-300 mb-4">
                <span className="font-medium">Contract Address:</span> {contractAddress}
            </div>

            <button
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                onClick={onExecute}
                disabled={isDisabled}
            >
                Execute Transaction
            </button>
        </div>
    );
};

// Component to display transaction status
interface TransactionStatusProps {
    status: string;
    error: Error | null;
    hash: string | null;
    network: string;
    onReset: () => void;
}

const TransactionStatusComponent: React.FC<TransactionStatusProps> = ({
    status,
    error,
    hash,
    network,
    onReset
}) => {
    const renderStatus = () => {
        switch (status) {
            case 'idle':
                return <p className="text-gray-500">No transaction in progress</p>;
            case 'preparing':
                return <p className="text-blue-500">Preparing transaction...</p>;
            case 'signing':
                return <p className="text-yellow-500">Waiting for signature...</p>;
            case 'submitted':
                return (
                    <div className="text-green-500">
                        <p>Transaction submitted!</p>
                        {hash && (
                            <a
                                href={`https://${network === 'mainnet' ? '' : network + '.'}etherscan.io/tx/${hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline"
                            >
                                View on Etherscan
                            </a>
                        )}
                    </div>
                );
            case 'error':
                return <p className="text-red-500">Error: {error?.message.slice(0, 100)}...</p>;
            default:
                return null;
        }
    };

    return (
        <div className="mt-4 p-3 bg-gray-700 rounded-md">
            <h4 className="text-lg font-medium text-white mb-2">Transaction Status</h4>
            {renderStatus()}

            {status !== 'idle' && (
                <button
                    className="mt-3 px-4 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors"
                    onClick={onReset}
                    disabled={status === 'signing'}
                >
                    Reset
                </button>
            )}
        </div>
    );
};

// Function to display transaction data in a window
const openTransactionDataWindow = (data: string) => {
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

// Main Transaction Demo component
export function TransactionDemo(): JSX.Element {
    const { isConnected } = useAccount();
    const { status, error, hash, rawTransactionData, prepareTransaction, executeTransaction, resetState } = useTransactionHook();
    const [amount, setAmount] = useState<string>('0');
    const [contractAddress, setContractAddress] = useState<string>('');
    const [contractFunctions, setContractFunctions] = useState<ContractFunction[]>([]);
    const [contractError, setContractError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [network, setNetwork] = useState<'mainnet' | 'sepolia' | 'goerli'>('sepolia');
    const [selectedFunction, setSelectedFunction] = useState<ContractFunction | null>(null);
    const [inputValues, setInputValues] = useState<Record<string, string>>({});
    const [contractAbi, setContractAbi] = useState<EtherscanAbiItem[]>([]);

    // Reset input values when selecting a different function
    useEffect(() => {
        if (selectedFunction) {
            const newInputValues: Record<string, string> = {};
            selectedFunction.inputs.forEach(input => {
                newInputValues[input.name || `param${input.type}`] = '';
            });
            setInputValues(newInputValues);
        }
    }, [selectedFunction]);

    // Function to fetch contract ABI
    const fetchContractABI = async () => {
        if (!contractAddress || !contractAddress.startsWith('0x')) {
            setContractError('Please enter a valid contract address');
            return;
        }

        setIsLoading(true);
        setContractError(null);
        setContractFunctions([]);
        setSelectedFunction(null);
        setContractAbi([]);

        try {
            // Use the local implementation
            const result = await getContractSourceCode(contractAddress, network);

            if (!result.success || !result.isVerified) {
                setContractError(result.isVerified ? 'Error fetching contract data' : 'Contract is not verified');
                setIsLoading(false);
                return;
            }

            try {
                let abiItems: EtherscanAbiItem[] = [];

                // Handle different response formats from Etherscan
                if (Array.isArray(result.result)) {
                    // If result is an array, take the first item's ABI
                    const sourceCodeItem = result.result[0];
                    if (sourceCodeItem && sourceCodeItem.ABI) {
                        try {
                            abiItems = JSON.parse(sourceCodeItem.ABI);
                        } catch (e) {
                            console.error('Error parsing ABI JSON:', e);
                            setContractError('Invalid ABI format returned from Etherscan');
                            setIsLoading(false);
                            return;
                        }
                    }
                }

                if (abiItems.length === 0) {
                    setContractError('No ABI found for this contract');
                    setIsLoading(false);
                    return;
                }

                // Store the full ABI for later use
                setContractAbi(abiItems);

                // Filter to only get functions
                const functions = abiItems
                    .filter(item => item.type === 'function')
                    .map(item => ({
                        name: item.name || '',
                        type: item.type,
                        inputs: item.inputs || [],
                        outputs: item.outputs || [],
                        stateMutability: item.stateMutability || (item.payable ? 'payable' : (item.constant ? 'view' : 'nonpayable'))
                    }));

                setContractFunctions(functions);

                if (functions.length === 0) {
                    setContractError('No callable functions found in this contract');
                }
            } catch (err) {
                console.error('Error parsing ABI:', err);
                setContractError('Unable to parse contract ABI');
            }
        } catch (err) {
            console.error('Error fetching contract:', err);
            setContractError('Error fetching contract data');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle input change for function parameters
    const handleInputChange = (name: string, value: string) => {
        setInputValues(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Function to prepare arguments for transaction based on input types
    const prepareArgs = (inputs: ContractInput[], inputValues: Record<string, string>) => {
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

    // Custom reset function
    const handleReset = () => {
        if (window.confirm('Are you sure you want to reset?')) {
            resetState();
            setSelectedFunction(null);
            setInputValues({});
        }
    };

    // Updated function to handle contract interaction
    const handleSignTransaction = async () => {
        if (!selectedFunction) {
            alert('Please select a function to call');
            return;
        }

        try {
            // Prepare the arguments based on the function inputs
            const args = prepareArgs(selectedFunction.inputs, inputValues);

            // Prepare the transaction
            await prepareTransaction({
                address: contractAddress as `0x${string}`,
                abi: contractAbi,
                functionName: selectedFunction.name,
                args
            });
        } catch (err) {
            console.error('Error in transaction process:', err);
        }
    };

    // Add this useEffect to handle transaction execution after preparation
    useEffect(() => {
        const handlePreparedTransaction = async () => {
            if (rawTransactionData && status === 'preparing') {
                try {
                    // Start the transaction execution process - this will trigger the wallet extension
                    const executionPromise = executeTransaction();

                    // After a small delay to ensure wallet popup has appeared, show the tx data window
                    setTimeout(() => {
                        openTransactionDataWindow(rawTransactionData);
                    }, 2000);

                    // Wait for the transaction execution to complete
                    await executionPromise;
                } catch (err) {
                    console.error('Error executing transaction:', err);
                }
            }
        };

        handlePreparedTransaction();
    }, [rawTransactionData, status, executeTransaction]);

    return (
        <div className="max-w-6xl mx-auto p-6 bg-gray-800 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-white mb-6">Transaction Demo</h2>

            {isConnected ? (
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Left column - Contract Explorer */}
                    <div className="md:w-1/2">
                        <ContractExplorer
                            network={network}
                            onNetworkChange={setNetwork}
                            contractAddress={contractAddress}
                            onAddressChange={setContractAddress}
                            isLoading={isLoading}
                            error={contractError}
                            functions={contractFunctions}
                            selectedFunction={selectedFunction}
                            onSelectFunction={setSelectedFunction}
                            onFetchABI={fetchContractABI}
                        />
                    </div>

                    {/* Right column - Interaction & Status */}
                    <div className="md:w-1/2 space-y-4">
                        <ContractInteractionForm
                            selectedFunction={selectedFunction}
                            contractAddress={contractAddress}
                            inputValues={inputValues}
                            onInputChange={handleInputChange}
                            amount={amount}
                            onAmountChange={setAmount}
                            onExecute={handleSignTransaction}
                            isDisabled={status !== 'idle' && status !== 'error'}
                        />

                        <TransactionStatusComponent
                            status={status}
                            error={error}
                            hash={hash}
                            network={network}
                            onReset={handleReset}
                        />
                    </div>
                </div>
            ) : (
                <p className="text-gray-400">Please connect your wallet to continue</p>
            )}
        </div>
    );
}