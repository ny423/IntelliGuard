// @ts-expect-error - Workflow execution results type checking
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
                address: contractResult.getContractStep.output.contractAddress,
                isVerified: contractResult.getContractStep.output.isVerified,
            },
            analysis: {
                securityIssues: contractResult.analyzeContractStep.output.securityIssues,
                stateChanges: contractResult.analyzeContractStep.output.stateChanges,
                score: contractResult.analyzeContractStep.output.score,
            },
            recommendations: {
                recommendations: contractResult.recommendationStep.output.recommendations,
                prioritizedActions: contractResult.recommendationStep.output.prioritizedActions,
                summary: contractResult.recommendationStep.output.summary,
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