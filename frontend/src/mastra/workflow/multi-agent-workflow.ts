import { z } from "zod";
import { Step, Workflow } from "@mastra/core/workflows";
import { getContractSourceCode } from "../tools/contract";
import { Agent } from "@mastra/core/agent";
import { xai } from "@ai-sdk/xai";

// Create the analyzer agent
const contractAnalyzerAgent = new Agent({
    name: "ContractAnalyzer",
    instructions: `You are a smart contract security expert. When given contract code and transaction details:
1. First decode the transaction details and identify which function is called, with the arguments
2. Analyze the state change and security issues mentioned in the following table after the transaction only on the user side
3. Only report potential issues mentioned below
4. Score the transaction from 0 to 100 based on the potential issues, based on the following table:

User-Side Dangers in a Single Transaction (with Penalty Scores)
#	Violation in Transaction	Reason It's Dangerous	Penalty
1	Approving unlimited allowance (approve(max) or 2^256-1)	Malicious contract can drain all your tokens later.	–30
2	Calling an unknown contract (not verified or trusted)	The logic is invisible — could steal funds, lock tokens, or run self-destruct.	–40
3	Calling a function you don’t understand (e.g., multicall, delegatecall, or oddly named functions)	Could do more than expected, such as stealing tokens or taking approvals.	–25
4	Sending tokens (transfer, transferFrom) to the wrong or suspicious address	Tokens are irreversible — once sent, they’re gone.	–20
5	Sending native tokens (ETH, etc.) to a contract that doesn't handle them	Tokens may be lost forever if contract doesn’t have a fallback function.	–15
6	Calling mint/burn/claim/airdrop on an untrusted contract	May trigger hidden approvals, token theft, or contract bricking.	–20
7	Signing a transaction with unexpected calldata	Some attacks hide malicious calls in data, e.g., approve() to attacker.	–25
8	Submitting a transaction with a clearly high gas limit or value (without knowing why)	Could result in unexpected costs or execution of malicious logic.	–10
9	Interacting with proxy contracts with upgradable logic (if source is unknown)	You trust a contract that could change at any moment.	–15
10	Not verifying network and chain ID (e.g., wrong L2)	You could sign on wrong network, lose funds or interact with a fake contract.	–10
`,
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