import React, { useState, useEffect } from 'react';
import { ContractFunction } from '../types/contract';
import { validateParam } from '../utils/contractUtils';

interface FunctionParamsProps {
    selectedFunction: ContractFunction;
    inputValues: Record<string, string>;
    onInputChange: (name: string, value: string) => void;
    amount: string;
    onAmountChange: (value: string) => void;
}

export const FunctionParams: React.FC<FunctionParamsProps> = ({
    selectedFunction,
    inputValues,
    onInputChange,
    amount,
    onAmountChange
}) => {
    // State for validation errors
    const [validationErrors, setValidationErrors] = useState<Record<string, string | null>>({});

    // Validate inputs whenever they change
    useEffect(() => {
        const newValidationErrors: Record<string, string | null> = {};

        selectedFunction.inputs.forEach(input => {
            const paramName = input.name || `param${input.type}`;
            const value = inputValues[paramName] || '';

            // Only validate if there's input
            if (value.trim()) {
                const validation = validateParam(input.type, value);
                newValidationErrors[paramName] = validation.error;
            } else {
                newValidationErrors[paramName] = null;
            }
        });

        setValidationErrors(newValidationErrors);
    }, [inputValues, selectedFunction.inputs]);

    return (
        <div className="space-y-3 mb-4">
            {selectedFunction.inputs.length > 0 ? (
                selectedFunction.inputs.map((input, idx) => {
                    const paramName = input.name || `param${input.type}`;
                    const isArray = input.type.endsWith('[]');
                    const placeholder = isArray
                        ? `Enter comma-separated ${input.type.slice(0, -2)} values`
                        : `Enter ${input.type} value`;
                    const hasError = !!validationErrors[paramName];

                    return (
                        <div key={idx}>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                {input.name || `Parameter ${idx + 1}`} <span className="text-gray-400">({input.type})</span>
                            </label>
                            <input
                                type="text"
                                className={`w-full px-3 py-2 bg-gray-800 border ${hasError ? 'border-red-500' : 'border-gray-600'} rounded-md text-white`}
                                placeholder={placeholder}
                                value={inputValues[paramName] || ''}
                                onChange={(e) => onInputChange(paramName, e.target.value)}
                            />
                            {hasError && (
                                <p className="text-xs text-red-400 mt-1">
                                    {validationErrors[paramName]}
                                </p>
                            )}
                            {isArray && (
                                <p className="text-xs text-gray-400 mt-1">
                                    For multiple values, separate with commas (e.g., 0x123,0x456)
                                </p>
                            )}
                        </div>
                    );
                })
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
};

export default FunctionParams; 