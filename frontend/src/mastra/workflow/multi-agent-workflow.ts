import { z } from "zod";
import { Step, Workflow } from "@mastra/core/workflows";
import { getContractSourceCode } from "../tools/contract";
import { Agent } from "@mastra/core/agent";
import { xai } from "@ai-sdk/xai";

// Create the analyzer agent
const contractAnalyzerAgent = new Agent({
    name: "ContractAnalyzer",
    instructions: `You are a smart contract security expert focused on ownership and authorization patterns. When analyzing contract code and transaction details:

1. First decode the transaction details to identify the function called and its arguments
2. Analyze ONLY the following ownership and authorization aspects:

Critical Security Aspects to Check (with Penalty Scores):

A. Ownership Issues (–40 points each):
- Unauthorized ownership transfer attempts
- Missing ownership validation
- Centralization risks from owner privileges
- Ownership transfer to zero address
- Single-step ownership transfers (vs. two-step pattern)

B. Authorization Issues (–30 points each):
- Missing or incorrect access controls
- Privilege escalation possibilities
- Unprotected critical functions
- Improper role management
- Bypass of authorization checks

C. State Management Issues (–20 points each):
- Unprotected state variables
- Incorrect state transitions
- Missing events for critical state changes
- Improper initialization

For each transaction:
1. List all identified issues under "Security Issues:"
2. List all state changes under "State Changes:"
3. Calculate final score starting from 100 and subtracting penalties
4. Format output exactly as:

Security Issues:
- [List each issue]

State Changes:
- [List each change]

Score: [final_score]`,
    model: xai("grok-2-1212"),
});

// Create the recommender agent
const transactionSuggestionsAgent = new Agent({
    name: "TransactionSuggestions",
    instructions: `You are an expert in smart contract ownership and authorization security. When providing recommendations:

1. Focus ONLY on ownership and authorization-related improvements:
   - Ownership transfer mechanisms
   - Access control patterns
   - Role-based authorization
   - Event emission for ownership changes
   - State variable protection

2. For each security issue found, provide:
   - Detailed explanation of the risk
   - Specific code-level fix
   - Implementation priority (Critical/High/Medium/Low)

3. Structure your response in JSON format:
{
    "recommendations": [
        "detailed recommendation 1",
        "detailed recommendation 2"
    ],
    "prioritizedActions": [
        "Critical: action 1",
        "High: action 2"
    ],
    "summary": "Brief security assessment focusing on ownership and authorization"
}`,
    model: xai("grok-2-1212"),
});

// Create the workflow
export const multiAgentWorkflow = new Workflow({
    name: "multi-agent-contract-workflow",
    triggerSchema: z.object({
        address: z.string(),
        network: z.string(),
        transactionData: z.string(),
        functionName: z.string(),
        functionArgs: z.array(z.string()),
    }),
});

// Step 1: Get contract source code
const getContractStep = new Step({
    id: "getContractStep",
    outputSchema: z.object({
        success: z.boolean(),
        contractAddress: z.string(),
        network: z.string(),
        SourceCode: z.string(),
        abi: z.string(),
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
                securityIssues: [`Failed to get contract source code: ${result.SourceCode}`],
                stateChanges: [],
                score: 0,
            };
        }
        console.log(`result.SourceCode: ${JSON.stringify(result.SourceCode)}`);
        const analysisPrompt = `
Contract Code:
${JSON.stringify(result.SourceCode)}

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

        const recommendationPrompt = `
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
3. A brief summary of the contract's overall security posture
`;

        const recommendationResult = await transactionSuggestionsAgent.generate(recommendationPrompt);

        try {
            const text = recommendationResult.text;
            return JSON.parse(text);
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