'use client';

import { useState, useEffect, JSX } from 'react';
import { useAccount } from 'wagmi';
import { useTransactionHook } from '../hooks/useTransactionHook';


export function TransactionDemo(): JSX.Element {
    const { isConnected } = useAccount();
    const { status, error, hash, rawTransactionData, prepareTransaction, executeTransaction, resetState } = useTransactionHook();
    const [recipient, setRecipient] = useState<string>('0x0000000000000000000000000000000000000000');
    const [amount, setAmount] = useState<string>('0');

    // Function to open transaction data in a new window
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

    // Custom reset function
    const handleReset = () => {
        if (window.confirm('Are you sure you want to reset?')) {
            resetState();
        }
    };

    const renderTransactionStatus = () => {
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
                                href={`https://etherscan.io/tx/${hash}`}
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

    const handleSignTransaction = async () => {
        try {
            const demoAbi = [
                {
                    name: 'transfer',
                    type: 'function',
                    stateMutability: 'nonpayable',
                    inputs: [
                        { name: 'to', type: 'address' },
                        { name: 'value', type: 'uint256' }
                    ],
                    outputs: [{ name: '', type: 'bool' }]
                }
            ] as const;
            const contractAddress = '0x1234567890123456789012345678901234567890' as `0x${string}`;

            // Just prepare the transaction and wait for it to complete
            await prepareTransaction({
                address: contractAddress,
                abi: demoAbi,
                functionName: 'transfer' as const,
                args: [recipient as `0x${string}`, BigInt(amount)]
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
        <div className="max-w-lg mx-auto p-6 bg-gray-800 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-white mb-6">Transaction Demo</h2>

            {isConnected ? (
                <div className="space-y-4">
                    <div>
                        <label htmlFor="recipient" className="block text-sm font-medium text-gray-300">
                            Recipient Address
                        </label>
                        <input
                            id="recipient"
                            type="text"
                            className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                            value={recipient}
                            onChange={(e) => setRecipient(e.target.value)}
                            placeholder="0x..."
                        />
                    </div>

                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-300">
                            Amount
                        </label>
                        <input
                            id="amount"
                            type="text"
                            className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0"
                        />
                    </div>

                    <div className="flex space-x-4">
                        <button
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                            onClick={handleSignTransaction}
                            disabled={status !== 'idle' && status !== 'error'}
                        >
                            Sign Transaction
                        </button>

                        <button
                            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                            onClick={handleReset}
                            disabled={status === 'signing'}
                        >
                            Reset
                        </button>
                    </div>

                    <div className="mt-4">
                        {renderTransactionStatus()}
                    </div>
                </div>
            ) : (
                <p className="text-gray-400">Please connect your wallet to continue</p>
            )}
        </div>
    );
}