'use client';

import { useState, useEffect, JSX } from 'react';
import { useAccount } from 'wagmi';
import { useTransactionHook } from '../hooks/useTransactionHook';
import { ContractFunction, EtherscanAbiItem } from '../types/contract';
import { getContractSourceCode, openTransactionDataWindow, prepareArgs, validateInputs } from '../utils/contractUtils';
import ContractExplorer from './ContractExplorer';
import ContractInteractionForm from './ContractInteractionForm';
import TransactionStatus from './TransactionStatus';

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
            // First validate all inputs
            const validation = validateInputs(selectedFunction.inputs, inputValues);

            if (!validation.isValid) {
                // Show error and don't proceed with transaction
                alert(validation.error);
                return;
            }

            // All inputs are valid, prepare the arguments
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

            // Display appropriate error message
            if (err instanceof Error) {
                let errorMessage = err.message;

                // Format specific error types nicely
                if (errorMessage.includes('invalid address')) {
                    errorMessage = 'Invalid Ethereum address provided. Address must be 42 characters (0x + 40 hex characters).';
                } else if (errorMessage.includes('not a valid array')) {
                    errorMessage = 'One of the inputs should be an array. For array inputs, please separate multiple values with commas.';
                }

                alert(`Error: ${errorMessage}`);
            } else {
                alert('An unknown error occurred.');
            }
        }
    };

    // Update the useEffect for transaction execution to only proceed if status is 'preparing'
    useEffect(() => {
        const handlePreparedTransaction = async () => {
            if (rawTransactionData && status === 'preparing') {
                try {
                    // Start the transaction execution process - this will trigger the wallet extension
                    const executionPromise = executeTransaction();

                    // After a small delay to ensure wallet popup has appeared, show the tx data window
                    setTimeout(() => {
                        // Only open the window if we're still in 'preparing' or 'signing' status
                        // This prevents opening it if an error occurred in between
                        if (status === 'preparing' || status === 'signing') {
                            openTransactionDataWindow(rawTransactionData);
                        }
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

                        <TransactionStatus
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

export default TransactionDemo;