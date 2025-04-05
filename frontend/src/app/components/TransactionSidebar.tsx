'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { analyzeTransaction } from '@/app/actions/contract-actions';

interface TransactionSidebarProps {
    data: string;
    contractAddress: string;
    network: string;
    isOpen: boolean;
    onClose: () => void;
    functionName: string;
    functionArgs: string[];
}

interface AnalysisResults {
    success: boolean;
    contract?: {
        address: string;
        isVerified: boolean;
    };
    analysis?: {
        securityIssues: string[];
        stateChanges: string[];
        score: number;
    };
    recommendations?: {
        recommendations: string[];
        prioritizedActions: string[];
        summary: string;
    };
    error?: string;
    debugLogs?: string[];
}

const TransactionSidebar: React.FC<TransactionSidebarProps> = ({
    data,
    contractAddress,
    network,
    isOpen,
    onClose,
    functionName,
    functionArgs
}) => {
    const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [analysisStatus, setAnalysisStatus] = useState<string>('');
    const [showDebugLogs, setShowDebugLogs] = useState(false);

    // Function to reset all previous analysis data
    const resetAnalysisState = useCallback(() => {
        setAnalysisResults(null);
        setError(null);
        setAnalysisStatus('');
        setShowDebugLogs(false);
        console.log('Analysis state has been reset');
    }, []);

    const runAnalysis = useCallback(async () => {
        // Reset previous analysis data before starting a new one
        resetAnalysisState();

        setIsAnalyzing(true);
        setAnalysisStatus('Starting transaction analysis...');

        try {
            // Call the non-streaming analyzeTransaction function
            console.log('Initiating transaction analysis for contract:', contractAddress);
            setAnalysisStatus('Executing multi-agent workflow...');

            const result = await analyzeTransaction({
                address: contractAddress,
                network: network,
                transactionData: data,
                functionName: functionName,
                functionArgs: functionArgs
            });

            console.log('Analysis completed:', result.success ? 'Success' : 'Failed');

            // Set the complete result
            setAnalysisResults(result);

            if (result.success) {
                setAnalysisStatus('Analysis completed successfully');
            } else if (result.error) {
                setError(result.error);
                setAnalysisStatus('Analysis failed');
                console.error('Analysis error:', result.error);
            }
        } catch (err) {
            console.error('Analysis failed with exception:', err);
            setError(err instanceof Error ? err.message : 'Unknown error occurred during analysis');
            setAnalysisStatus('Analysis failed due to an unexpected error');
        } finally {
            setIsAnalyzing(false);
        }
    }, [contractAddress, network, data, resetAnalysisState]);

    useEffect(() => {
        if (isOpen && contractAddress && network && data) {
            runAnalysis();
        }
    }, [isOpen, contractAddress, network, data, runAnalysis]);

    const handleCopy = () => {
        navigator.clipboard.writeText(data)
            .then(() => {
                // Create a temporary notification
                const notification = document.createElement('div');
                notification.className = 'absolute top-2 right-2 bg-green-600 text-white px-3 py-1 rounded text-sm';
                notification.textContent = 'Copied to clipboard!';
                document.body.appendChild(notification);

                // Remove after 2 seconds
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 2000);
            })
            .catch(err => console.error('Failed to copy: ', err));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed left-0 top-0 h-full w-1/3 bg-gray-800 shadow-xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto">
            <div className="flex flex-col h-full">
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl text-white font-semibold">Transaction Analysis</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-4 bg-gray-800 text-gray-200">
                    {/* Transaction Data Section */}
                    <div className="bg-gray-700 p-3 rounded mb-4 border-l-4 border-green-500">
                        <p>Transaction data for contract at {contractAddress}</p>
                    </div>

                    <div className="flex justify-between mb-2">
                        <button
                            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm flex items-center"
                            onClick={runAnalysis}
                            disabled={isAnalyzing}
                        >
                            {isAnalyzing ? (
                                <>
                                    <div className="animate-spin h-4 w-4 border-2 border-white rounded-full mr-2 border-t-transparent"></div>
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Re-analyze Transaction
                                </>
                            )}
                        </button>

                        <button
                            className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded text-sm"
                            onClick={handleCopy}
                        >
                            Copy to Clipboard
                        </button>
                    </div>

                    <div className="bg-gray-700 p-4 rounded overflow-auto max-h-48 font-mono text-sm whitespace-pre-wrap break-all mb-4">
                        {data}
                    </div>

                    {/* Analysis Status Message */}
                    {analysisStatus && (
                        <div className={`mt-4 p-3 rounded ${isAnalyzing ? 'bg-blue-900' : analysisResults?.success ? 'bg-green-800' : 'bg-yellow-800'}`}>
                            <p className="font-medium">{analysisStatus}</p>
                        </div>
                    )}

                    {/* Analysis Progress Section */}
                    {isAnalyzing && (
                        <div className="mt-4">
                            <div className="flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                <p>Analyzing transaction... This may take a moment</p>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
                                <div className="bg-blue-600 h-2.5 rounded-full animate-pulse w-full"></div>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="mt-4 p-3 bg-red-800 text-white rounded">
                            <h4 className="font-semibold mb-1">Error during analysis:</h4>
                            <p>{error}</p>
                            <button
                                className="mt-2 bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded text-sm"
                                onClick={runAnalysis}
                            >
                                Try Again
                            </button>
                        </div>
                    )}

                    {/* Debug Logs Toggle */}
                    {analysisResults?.debugLogs && analysisResults.debugLogs.length > 0 && !isAnalyzing && (
                        <div className="mt-4">
                            <button
                                className="text-blue-400 hover:text-blue-300 text-sm underline"
                                onClick={() => setShowDebugLogs(!showDebugLogs)}
                            >
                                {showDebugLogs ? 'Hide Debug Logs' : 'Show Debug Logs'}
                            </button>

                            {showDebugLogs && (
                                <div className="mt-2 bg-gray-900 p-3 rounded text-xs font-mono overflow-auto max-h-60">
                                    {analysisResults.debugLogs.map((log, idx) => (
                                        <div key={idx} className="mb-1 border-b border-gray-800 pb-1">
                                            {log}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Analysis Results */}
                    {analysisResults && !isAnalyzing && (
                        <div className="mt-4">
                            <h3 className="text-lg font-semibold mb-2">Analysis Results</h3>

                            {analysisResults.contract && (
                                <div className="mb-2 text-sm bg-gray-700 p-3 rounded">
                                    <p className="font-medium">Contract Information:</p>
                                    <p>Address: {analysisResults.contract.address}</p>
                                    <p>Status: {analysisResults.contract.isVerified
                                        ? "✅ Verified"
                                        : "⚠️ Unverified"}</p>
                                </div>
                            )}

                            {analysisResults.analysis && (
                                <div className="bg-gray-700 p-3 rounded mb-4">
                                    <h4 className="font-semibold mb-2">
                                        Security Score: {analysisResults.analysis.score}/100
                                        {analysisResults.analysis.score >= 80 ? " ✅" :
                                            analysisResults.analysis.score >= 50 ? " ⚠️" : " ❌"}
                                    </h4>

                                    {analysisResults.analysis.securityIssues.length > 0 && (
                                        <div className="mb-3">
                                            <h5 className="text-yellow-400 mb-1">Security Issues:</h5>
                                            <ul className="list-disc pl-5 space-y-1">
                                                {analysisResults.analysis.securityIssues.map((issue, idx) => (
                                                    <li key={idx}>{issue}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {analysisResults.analysis.stateChanges.length > 0 && (
                                        <div>
                                            <h5 className="text-blue-400 mb-1">State Changes:</h5>
                                            <ul className="list-disc pl-5 space-y-1">
                                                {analysisResults.analysis.stateChanges.map((change, idx) => (
                                                    <li key={idx}>{change}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}

                            {analysisResults.recommendations && (
                                <div className="bg-gray-700 p-3 rounded">
                                    <h4 className="font-semibold mb-2">Recommendations</h4>

                                    <div className="mb-3">
                                        <h5 className="text-green-400 mb-1">Summary:</h5>
                                        <p>{analysisResults.recommendations.summary}</p>
                                    </div>

                                    {analysisResults.recommendations.prioritizedActions.length > 0 && (
                                        <div className="mb-3">
                                            <h5 className="text-orange-400 mb-1">Prioritized Actions:</h5>
                                            <ul className="list-disc pl-5 space-y-1">
                                                {analysisResults.recommendations.prioritizedActions.map((action, idx) => (
                                                    <li key={idx}>{action}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {analysisResults.recommendations.recommendations.length > 0 && (
                                        <div>
                                            <h5 className="text-blue-400 mb-1">Detailed Recommendations:</h5>
                                            <ul className="list-disc pl-5 space-y-1">
                                                {analysisResults.recommendations.recommendations.map((rec, idx) => (
                                                    <li key={idx}>{rec}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TransactionSidebar; 