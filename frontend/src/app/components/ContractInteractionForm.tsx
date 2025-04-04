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

export default ContractInteractionForm; 