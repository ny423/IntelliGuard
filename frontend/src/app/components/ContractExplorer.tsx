import React from 'react';
import { ContractFunction } from '../types/contract';
import FunctionItem from './FunctionItem';

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

export const ContractExplorer: React.FC<ContractExplorerProps> = ({
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
    <div className="border-b border-gray-700 pb-6 mb-6 md:border-b-0">
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

export default ContractExplorer; 