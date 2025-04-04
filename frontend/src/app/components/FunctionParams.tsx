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
                    const baseType = isArray ? input.type.slice(0, -2) : input.type;
                    const placeholder = isArray
                        ? `Enter comma-separated ${baseType} values`
                        : `Enter ${input.type} value`;
                    const hasError = !!validationErrors[paramName];

                    return (
                        <div key={idx} className={`p-3 rounded-md ${isArray ? 'bg-gray-750 border border-gray-600' : ''}`}>
                            <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center justify-between">
                                <span>{input.name || `Parameter ${idx + 1}`} <span className="text-gray-400">({input.type})</span></span>
                                {isArray && (
                                    <span className="px-2 py-0.5 text-xs bg-blue-900 text-blue-300 rounded-md">
                                        Array
                                    </span>
                                )}
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
                                <div className="mt-2 text-xs bg-blue-900 bg-opacity-20 p-2 rounded border border-blue-800">
                                    <p className="font-medium text-blue-300 mb-1">Array Input Format:</p>
                                    <ul className="list-disc list-inside pl-2 text-gray-300 space-y-1">
                                        <li>Separate multiple values with commas</li>
                                        <li>Example: <code className="bg-gray-800 px-1 py-0.5 rounded">{getExampleForType(baseType)}</code></li>
                                        <li>Leave empty for an empty array</li>
                                    </ul>
                                </div>
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

// Helper function to generate examples based on type
function getExampleForType(type: string): string {
    if (type === 'address') {
        return '0x1234...5678,0xabcd...ef01';
    } else if (type.startsWith('uint') || type.startsWith('int')) {
        return '123,456,789';
    } else if (type === 'bool') {
        return 'true,false,true';
    } else if (type === 'string') {
        return 'value1,value2,value3';
    } else {
        return 'value1,value2,value3';
    }
}

export default FunctionParams; 