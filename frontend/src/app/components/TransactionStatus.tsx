import React from 'react';

interface TransactionStatusProps {
    status: string;
    error: Error | null;
    hash: string | null;
    network: string;
    onReset: () => void;
}

export const TransactionStatus: React.FC<TransactionStatusProps> = ({
    status,
    error,
    hash,
    network,
    onReset
}) => {
    const renderStatus = () => {
        switch (status) {
            case 'idle':
                return <p className="text-gray-500">No transaction in progress</p>;
            case 'preparing':
                return (
                    <div className="text-blue-500">
                        <p>Preparing transaction...</p>
                        <p className="text-xs mt-1">A transaction data window should appear now. If not, check your browser&apos;s popup settings.</p>
                    </div>
                );
            case 'signing':
                return (
                    <div className="text-yellow-500">
                        <p>Waiting for signature...</p>
                        <p className="text-xs mt-1">Please check your wallet and approve the transaction.</p>
                    </div>
                );
            case 'submitted':
                return (
                    <div className="text-green-500">
                        <p>Transaction submitted!</p>
                        {hash && (
                            <a
                                href={`https://${network === 'mainnet' ? '' : network + '.'}etherscan.io/tx/${hash}`}
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

    return (
        <div className="mt-4 p-3 bg-gray-700 rounded-md">
            <h4 className="text-lg font-medium text-white mb-2">Transaction Status</h4>
            {renderStatus()}

            {status !== 'idle' && (
                <button
                    className="mt-3 px-4 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors"
                    onClick={onReset}
                    disabled={status === 'signing'}
                >
                    Reset
                </button>
            )}
        </div>
    );
};

export default TransactionStatus; 