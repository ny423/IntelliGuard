import React from 'react';

interface TransactionDataWindowProps {
    data: string;
}

const TransactionDataWindow: React.FC<TransactionDataWindowProps> = ({ data }) => {
    return (
        <div className="bg-gray-800 text-gray-200 min-h-screen p-6 font-sans">
            <h2 className="text-2xl text-white font-semibold mb-4">Transaction Data</h2>
            <div className="bg-gray-700 p-4 rounded-lg overflow-auto max-h-[80vh] font-mono text-sm whitespace-pre-wrap break-all">
                {data}
            </div>
        </div>
    );
};

export default TransactionDataWindow; 