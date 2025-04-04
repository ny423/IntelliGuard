'use client';

import { useState, useCallback } from 'react';
import { useWriteContract } from 'wagmi';
import { encodeFunctionData } from 'viem';

type TransactionStatus = 'idle' | 'preparing' | 'signing' | 'submitted' | 'success' | 'error';

// Define the transaction config type based on what writeContractAsync expects
type TransactionConfig = {
    address: `0x${string}`;
    abi: readonly object[];
    functionName: string;
    args?: readonly (string | number | bigint | boolean | `0x${string}`)[];
    // Add other fields that might be necessary for writeContractAsync
};

interface UseTransactionHookResult {
    status: TransactionStatus;
    error: Error | null;
    hash: string | null;
    rawTransactionData: string | null;
    prepareTransaction: (config: TransactionConfig) => Promise<void>;
    executeTransaction: () => Promise<void>;
    resetState: () => void;
}

export function useTransactionHook(): UseTransactionHookResult {
    const [status, setStatus] = useState<TransactionStatus>('idle');
    const [error, setError] = useState<Error | null>(null);
    const [hash, setHash] = useState<string | null>(null);
    const [transactionConfig, setTransactionConfig] = useState<TransactionConfig | null>(null);
    const [rawTransactionData, setRawTransactionData] = useState<string | null>(null);

    const { writeContractAsync } = useWriteContract();

    // Function to prepare transaction (before sending to wallet for signing)
    const prepareTransaction = useCallback(async (config: TransactionConfig) => {
        try {
            setStatus('preparing');
            setError(null);
            setHash(null);

            // Store configuration for later execution
            setTransactionConfig(config);

            // Generate the raw transaction data
            try {
                const data = encodeFunctionData({
                    abi: config.abi,
                    functionName: config.functionName,
                    args: config.args || [],
                });
                setRawTransactionData(data);
            } catch (encodeErr) {
                console.error('Error encoding function data:', encodeErr);
            }

            // Here you can implement custom logic before the transaction is sent to the wallet
            console.log('Transaction prepared and ready to be signed');

            // You can add additional custom logic here:
            // - Validate transaction parameters
            // - Show a confirmation UI
            // - Log analytics events
            // - Calculate gas costs
            // - etc.

            return Promise.resolve();
        } catch (err) {
            setStatus('error');
            setError(err instanceof Error ? err : new Error('Failed to prepare transaction'));
            return Promise.reject(err);
        }
    }, []);

    // Function to execute the prepared transaction
    const executeTransaction = useCallback(async () => {
        if (!transactionConfig) {
            const error = new Error('Transaction not prepared');
            setError(error);
            setStatus('error');
            return Promise.reject(error);
        }

        try {
            setStatus('signing');

            // Send transaction to wallet for signing
            const hash = await writeContractAsync(transactionConfig);

            setHash(hash);
            setStatus('submitted');

            // You can add additional handling here for transaction monitoring
            console.log('Transaction submitted:', hash);

            return Promise.resolve();
        } catch (err) {
            setStatus('error');
            setError(err instanceof Error ? err : new Error('Transaction failed'));
            return Promise.reject(err);
        }
    }, [transactionConfig, writeContractAsync]);

    // Reset the state
    const resetState = useCallback(() => {
        setStatus('idle');
        setError(null);
        setHash(null);
        setTransactionConfig(null);
        setRawTransactionData(null);
    }, []);

    return {
        status,
        error,
        hash,
        rawTransactionData,
        prepareTransaction,
        executeTransaction,
        resetState
    };
} 