import React from 'react';
import { ContractFunction } from '../types/contract';

interface FunctionItemProps {
    func: ContractFunction;
    isSelected: boolean;
    onSelect: () => void;
}

export const FunctionItem: React.FC<FunctionItemProps> = ({ func, isSelected, onSelect }) => {
    // Determine if this is a read-only function
    const isReadOnly = func.stateMutability === 'view' || func.stateMutability === 'pure';

    // Style based on function type
    const typeColor = isReadOnly ? 'text-blue-400' : 'text-green-400';
    const buttonColor = isSelected
        ? (isReadOnly ? 'bg-blue-700' : 'bg-green-700')
        : 'bg-gray-700';
    const hoverColor = isReadOnly ? 'hover:bg-blue-600' : 'hover:bg-green-600';

    return (
        <div className={`p-2 border-b border-gray-700 last:border-b-0 ${isSelected ? 'bg-gray-800' : ''}`}>
            <div className={`font-medium ${typeColor} flex items-center justify-between`}>
                <span>{func.name}</span>
                <span className="text-gray-400 text-xs ml-2 px-2 py-1 rounded bg-gray-800">
                    {func.stateMutability || 'nonpayable'}
                </span>
            </div>

            <div className="text-sm text-gray-300 mt-1">
                Inputs: {func.inputs.length ?
                    func.inputs.map(input => `${input.name || 'param'} (${input.type})`).join(', ') :
                    'None'}
            </div>

            {func.outputs && (
                <div className="text-sm text-gray-300 mt-1">
                    Outputs: {func.outputs.length ?
                        func.outputs.map(output => `${output.name || 'return'} (${output.type})`).join(', ') :
                        'None'}
                </div>
            )}

            <button
                className={`mt-2 px-3 py-1 text-sm ${buttonColor} ${hoverColor} text-white rounded transition-colors`}
                onClick={onSelect}
            >
                {isSelected ? 'Selected' : isReadOnly ? 'Call Function' : 'Use Function'}
            </button>
        </div>
    );
};

export default FunctionItem; 