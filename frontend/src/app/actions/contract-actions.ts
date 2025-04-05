/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { multiAgentWorkflow } from '@/mastra/workflow/multi-agent-workflow';

// Define types for our transaction analysis
interface TransactionAnalysisParams {
    address: string;
    network: string;
    transactionData: string;
}

interface AnalysisResult {
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
    debugLogs?: string[];  // New field to track execution steps
}

/**
 * Server action to analyze a transaction using the multi-agent workflow
 * Returns the complete analysis results once the workflow is finished
 */
export async function analyzeTransaction(params: TransactionAnalysisParams): Promise<AnalysisResult> {
    console.log(`[ANALYSIS] Starting analysis for contract: ${params.address} on network: ${params.network}`);
    const debugLogs: string[] = [];

    try {
        debugLogs.push(`Analysis started at ${new Date().toISOString()}`);

        // Start the workflow execution
        console.log(`[ANALYSIS] Executing workflow...`);
        debugLogs.push('Executing multi-agent workflow...');

        const execution = await (multiAgentWorkflow as any).execute({
            address: params.address,
            network: params.network,
            transactionData: params.transactionData,
        });

        console.log(`[ANALYSIS] Workflow started, fetching contract source code...`);
        debugLogs.push('Workflow started, fetching contract source code...');

        // Wait for all steps to complete
        console.log(`[ANALYSIS] Waiting for getContractStep to complete...`);
        const contractResult = await execution.getStepResult('getContractStep');
        console.log(`[ANALYSIS] Contract source code fetched. Verified: ${contractResult.isVerified}`);
        debugLogs.push(`Contract source code fetched. Verified: ${contractResult.isVerified}`);

        console.log(`[ANALYSIS] Waiting for analyzeContractStep to complete...`);
        debugLogs.push('Analyzing contract for security issues...');
        const analysisResult = await execution.getStepResult('analyzeContractStep');
        console.log(`[ANALYSIS] Contract analyzed. Found ${analysisResult.securityIssues.length} issues. Score: ${analysisResult.score}`);
        debugLogs.push(`Contract analyzed. Found ${analysisResult.securityIssues.length} security issues. Score: ${analysisResult.score}`);

        console.log(`[ANALYSIS] Waiting for recommendationStep to complete...`);
        debugLogs.push('Generating security recommendations...');
        const recommendationResult = await execution.getStepResult('recommendationStep');
        console.log(`[ANALYSIS] Recommendations generated. ${recommendationResult.recommendations.length} recommendations provided.`);
        debugLogs.push(`Recommendations generated. ${recommendationResult.recommendations.length} recommendations provided.`);

        debugLogs.push(`Analysis completed successfully at ${new Date().toISOString()}`);

        // Return the complete analysis results
        return {
            success: true,
            contract: {
                address: contractResult.contractAddress,
                isVerified: contractResult.isVerified,
            },
            analysis: {
                securityIssues: analysisResult.securityIssues,
                stateChanges: analysisResult.stateChanges,
                score: analysisResult.score,
            },
            recommendations: {
                recommendations: recommendationResult.recommendations,
                prioritizedActions: recommendationResult.prioritizedActions,
                summary: recommendationResult.summary,
            },
            debugLogs
        };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('[ANALYSIS ERROR]', error);
        debugLogs.push(`Error encountered: ${errorMsg}`);
        debugLogs.push(`Analysis failed at ${new Date().toISOString()}`);

        return {
            success: false,
            error: errorMsg,
            debugLogs
        };
    }
} 