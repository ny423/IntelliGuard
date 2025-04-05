/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod";
import { Step, Workflow } from "@mastra/core/workflows";
import { getContractSourceCode } from "../tools/contract";
import { Agent } from "@mastra/core/agent";
import { xai } from "@ai-sdk/xai";

// // Define the interface for workflow execution response
// interface WorkflowExecutionResult {
//     getStepResult: (stepId: string) => Promise<Record<string, any>>;
// }

// // Define the interface for the workflow trigger data
// interface WorkflowTriggerData {
//     address: string;
//     network: string;
//     transactionData: string;
// }

// Create the analyzer agent
const contractAnalyzerAgent = new Agent({
    name: "ContractAnalyzer",
    instructions: `You are a smart contract security expert. When given contract code and transaction details:
    1. Analyze the state change and security issues after the transaction only on the user side
    2. Only report potential issues (authorization issues, state changes, etc.) with the transaction (No general recommendations that can be applied to all transactions)
    3. Score the transaction from 0 to 100 based on the potential issues`,
    model: xai("grok-2-1212"),
});

// Create the recommender agent
const contractRecommenderAgent = new Agent({
    name: "ContractRecommender",
    instructions: "You are an expert smart contract security advisor. Provide actionable recommendations based on contract analysis.",
    model: xai("grok-2-1212"),
});

// Create the workflow
export const multiAgentWorkflow = new Workflow({
    name: "multi-agent-contract-workflow",
    triggerSchema: z.object({
        address: z.string(),
        network: z.string(),
        transactionData: z.string(),
    }),
});

// Step 1: Get contract source code
const getContractStep = new Step({
    id: "getContractStep",
    outputSchema: z.object({
        success: z.boolean(),
        contractAddress: z.string(),
        network: z.string(),
        result: z.object({
            SourceCode: z.string(),
        }),
        isVerified: z.boolean(),
    }),
    execute: async ({ context }) => {
        return await getContractSourceCode(context.triggerData.address, context.triggerData.network);
    },
});

// Step 2: Analyze contract with first agent
const analyzeContractStep = new Step({
    id: "analyzeContractStep",
    outputSchema: z.object({
        analysis: z.string(),
        securityIssues: z.array(z.string()),
        stateChanges: z.array(z.string()),
        score: z.number(),
    }),
    execute: async ({ context }) => {
        const result = context.getStepResult(getContractStep);
        if (!result.success) {
            return {
                analysis: "Failed to analyze contract",
                securityIssues: [`Failed to get contract source code: ${result.result}`],
                stateChanges: [],
                score: 0,
            };
        }
        console.log(`result.result.SourceCode: ${JSON.stringify(result.result.SourceCode)}`);
        const analysisPrompt = `
Contract Code:
${JSON.stringify(result.result.SourceCode)}

Transaction Details:
${context.triggerData.transactionData}
`;

        const analysisResult = await contractAnalyzerAgent.generate(analysisPrompt);

        try {
            // Extract structured information from the analysis
            const text = analysisResult.text;

            // Extract security issues
            let securityIssues: string[] = [];
            const securityIssuesMatch = text.match(/Security Issues?:([\s\S]*?)(?=State Changes:|$)/);
            if (securityIssuesMatch && securityIssuesMatch[1]) {
                securityIssues = securityIssuesMatch[1]
                    .split('-')
                    .filter(Boolean)
                    .map(issue => issue.trim());
            }

            // Extract state changes
            let stateChanges: string[] = [];
            const stateChangesMatch = text.match(/State Changes?:([\s\S]*?)(?=Score:|$)/);
            if (stateChangesMatch && stateChangesMatch[1]) {
                stateChanges = stateChangesMatch[1]
                    .split('-')
                    .filter(Boolean)
                    .map(change => change.trim());
            }

            // Extract score
            const scoreMatch = text.match(/Score:\s*(\d+)/);
            const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 5;

            return {
                analysis: text,
                securityIssues,
                stateChanges,
                score,
            };
        } catch (err) {
            // Fallback if parsing fails
            console.error('Error parsing analysis:', err);
            return {
                analysis: analysisResult.text,
                securityIssues: ["Could not parse security issues"],
                stateChanges: ["Could not parse state changes"],
                score: -1,
            };
        }
    },
});

// Step 3: Get recommendations from second agent based on analysis
const recommendationStep = new Step({
    id: "recommendationStep",
    outputSchema: z.object({
        recommendations: z.array(z.string()),
        prioritizedActions: z.array(z.string()),
        summary: z.string(),
    }),
    execute: async ({ context }) => {
        const analysisResult = context.getStepResult(analyzeContractStep);
        const contractResult = context.getStepResult(getContractStep);

        const recommendationPrompt = `Based on the following contract analysis, provide specific recommendations to improve the contract's security and functionality.
    
Contract Address: ${contractResult.contractAddress}
Network: ${contractResult.network}
Security Score: ${analysisResult.score}/100

Analysis:
${analysisResult.analysis}

Security Issues:
${analysisResult.securityIssues.map(issue => `- ${issue}`).join('\n')}

State Changes:
${analysisResult.stateChanges.map(change => `- ${change}`).join('\n')}

Please provide:
1. Specific recommendations to address each security issue
2. Prioritized list of actions (High/Medium/Low priority)
3. A brief summary of the contract's overall security posture`;

        const recommendationResult = await contractRecommenderAgent.generate(recommendationPrompt);

        try {
            const text = recommendationResult.text;

            // Extract recommendations
            let recommendations: string[] = [];
            const recommendationsMatch = text.match(/Recommendations:([\s\S]*?)(?=Prioritized Actions:|$)/);
            if (recommendationsMatch && recommendationsMatch[1]) {
                recommendations = recommendationsMatch[1]
                    .split(/\d+\./)
                    .filter(Boolean)
                    .map(rec => rec.trim());
            }

            // Extract prioritized actions
            let prioritizedActions: string[] = [];
            const prioritizedActionsMatch = text.match(/Prioritized Actions:([\s\S]*?)(?=Summary:|$)/);
            if (prioritizedActionsMatch && prioritizedActionsMatch[1]) {
                prioritizedActions = prioritizedActionsMatch[1]
                    .split('-')
                    .filter(Boolean)
                    .map(action => action.trim());
            }

            // Extract summary
            let summary = text;
            const summaryMatch = text.match(/Summary:([\s\S]*?)$/);
            if (summaryMatch && summaryMatch[1]) {
                summary = summaryMatch[1].trim();
            }

            return {
                recommendations,
                prioritizedActions,
                summary,
            };
        } catch (err) {
            // Fallback if parsing fails
            console.error('Error parsing recommendations:', err);
            return {
                recommendations: ["Review the contract for security vulnerabilities"],
                prioritizedActions: ["Address identified security issues"],
                summary: recommendationResult.text,
            };
        }
    },
});

// Chain the steps and commit the workflow
multiAgentWorkflow.step(getContractStep).then(analyzeContractStep).then(recommendationStep).commit();

// // Replace the mock execute implementation with a real one
// (multiAgentWorkflow as any).execute = async (triggerData: WorkflowTriggerData): Promise<WorkflowExecutionResult> => {
//     // Store results from each step execution
//     const stepResults = new Map<string, any>();

//     // Create a proper context object with all required properties
//     const createContext = (existingResults: Map<string, any>) => {
//         return {
//             triggerData,
//             steps: [getContractStep, analyzeContractStep, recommendationStep],
//             inputData: {},
//             attempts: 0,
//             getStepResult: (stepId: string) => existingResults.get(stepId)
//         };
//     };

//     // Execute getContractStep
//     const contractResult = await getContractStep.execute({
//         context: createContext(stepResults)
//     });
//     stepResults.set(getContractStep.id, contractResult);

//     // Execute analyzeContractStep
//     const analysisResult = await analyzeContractStep.execute({
//         context: createContext(stepResults)
//     });
//     stepResults.set(analyzeContractStep.id, analysisResult);

//     // Execute recommendationStep
//     const recommendationResult = await recommendationStep.execute({
//         context: createContext(stepResults)
//     });
//     stepResults.set(recommendationStep.id, recommendationResult);

//     // Return a WorkflowExecutionResult with access to all step results
//     return {
//         getStepResult: async (stepId: string) => {
//             const result = stepResults.get(stepId);
//             if (!result) {
//                 throw new Error(`No result found for step: ${stepId}`);
//             }
//             return result;
//         }
//     };
// };
