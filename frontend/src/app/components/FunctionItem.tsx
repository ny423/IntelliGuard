import React from 'react';
import { ContractFunction } from '../types/contract';

interface FunctionItemProps {
    func: ContractFunction;
    isSelected: boolean;
    onSelect: () => void;
}

export const FunctionItem: React.FC<FunctionItemProps> = ({ func, isSelected, onSelect }) => (
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

export default FunctionItem; 