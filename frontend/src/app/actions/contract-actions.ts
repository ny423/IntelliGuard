/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { multiAgentWorkflow } from '@/mastra/workflow/multi-agent-workflow';

// Define types for our transaction analysis
interface TransactionAnalysisParams {
    address: string;
    network: string;
    transactionData: string;
    functionName: string;
    functionArgs: string[];
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

        const { start, watch } = multiAgentWorkflow.createRun();

        const unsubscribe = watch(({ activePaths }) => {
            // console.log(`[ANALYSIS] Workflow result context: `, context);
            debugLogs.push(`[ANALYSIS] Workflow stepId: ${activePaths[0].stepId}`);
        });
        const execution = await start({ triggerData: params, });
        unsubscribe();
        // Return the complete analysis results
        const contractResult = execution.results;
        for (const result of Object.values(contractResult)) {
            console.log(`[ANALYSIS] Contract result: `, result);
        }
        return {
            success: true,
            contract: {
                address: (contractResult.getContractStep as any).output.contractAddress,
                isVerified: (contractResult.getContractStep as any).output.isVerified,
            },
            analysis: {
                securityIssues: (contractResult.analyzeContractStep as any).output.securityIssues,
                stateChanges: (contractResult.analyzeContractStep as any).output.stateChanges,
                score: (contractResult.analyzeContractStep as any).output.score,
            },
            recommendations: {
                recommendations: (contractResult.recommendationStep as any).output.recommendations,
                prioritizedActions: (contractResult.recommendationStep as any).output.prioritizedActions,
                summary: (contractResult.recommendationStep as any).output.summary,
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