import React from 'react';
import { ContractFunction } from '../types/contract';
import FunctionParams from './FunctionParams';

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

export const ContractInteractionForm: React.FC<ContractInteractionFormProps> = ({
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

    // Determine if this is a read-only function
    const isReadOnly = selectedFunction.stateMutability === 'view' || selectedFunction.stateMutability === 'pure';

    return (
        <div className="mb-6 p-4 bg-gray-700 rounded-lg">
            <h3 className="text-xl font-semibold text-white mb-4">
                Contract Interaction:
                <span className={isReadOnly ? "text-blue-400 ml-2" : "text-green-400 ml-2"}>
                    {selectedFunction.name}
                </span>
                <span className="text-gray-400 text-xs ml-2 px-2 py-1 rounded bg-gray-800">
                    {selectedFunction.stateMutability || 'nonpayable'}
                </span>
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

            {isReadOnly ? (
                <div className="mb-3 text-sm text-blue-300 bg-blue-900 bg-opacity-20 p-2 rounded">
                    This is a read-only function and won&apos;t require a transaction to be signed.
                </div>
            ) : (
                <div className="mb-3 text-sm text-green-300 bg-green-900 bg-opacity-20 p-2 rounded">
                    This function will require you to sign a transaction with your wallet.
                </div>
            )}

            <button
                className={`w-full px-4 py-2 ${isReadOnly
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-green-600 hover:bg-green-700'
                    } text-white rounded-md transition-colors`}
                onClick={onExecute}
                disabled={isDisabled}
            >
                {isReadOnly ? 'Call Function' : 'Execute Transaction'}
            </button>
        </div>
    );
};

export default ContractInteractionForm; 