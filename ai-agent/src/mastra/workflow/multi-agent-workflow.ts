import { z } from "zod";
import { Step, Workflow } from "@mastra/core/workflows";
import { getContractSourceCode } from "../tools/contract";
import { Agent } from "@mastra/core/agent";
import { xai } from "@ai-sdk/xai";

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
            const securityIssues = analysisResult.text.match(/Security Issues?:(.*?)(?=State Changes:|$)/s)?.[1]?.split('-').filter(Boolean).map(issue => issue.trim()) || [];
            const stateChanges = analysisResult.text.match(/State Changes?:(.*?)(?=Score:|$)/s)?.[1]?.split('-').filter(Boolean).map(change => change.trim()) || [];
            const scoreMatch = analysisResult.text.match(/Score:\s*(\d+)/);
            const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 5;

            return {
                analysis: analysisResult.text,
                securityIssues,
                stateChanges,
                score,
            };
        } catch (error) {
            // Fallback if parsing fails
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
            // Extract structured information from the recommendations
            const recommendations = recommendationResult.text.match(/Recommendations:(.*?)(?=Prioritized Actions:|$)/s)?.[1]?.split(/\d+\./).filter(Boolean).map(rec => rec.trim()) || [];
            const prioritizedActions = recommendationResult.text.match(/Prioritized Actions:(.*?)(?=Summary:|$)/s)?.[1]?.split('-').filter(Boolean).map(action => action.trim()) || [];
            const summary = recommendationResult.text.match(/Summary:(.*?)$/s)?.[1]?.trim() || recommendationResult.text;

            return {
                recommendations,
                prioritizedActions,
                summary,
            };
        } catch (error) {
            // Fallback if parsing fails
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
