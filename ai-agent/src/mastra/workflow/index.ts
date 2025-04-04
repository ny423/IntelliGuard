import { z } from "zod";
import { Step, Workflow } from "@mastra/core/workflows";
import { getContractSourceCode } from "../tools/contract";
import { analyzeContractAgent } from "../agents";
import { UIMessage } from "@ai-sdk/ui-utils";

export const myWorkflow = new Workflow({
    name: "my-workflow",
    triggerSchema: z.object({
        address: z.string(),
        network: z.string(),
    }),
});

const stepOne = new Step({
    id: "stepOne",
    outputSchema: z.object({
        success: z.boolean(),
        contractAddress: z.string(),
        network: z.string(),
        result: z.string(),
        isVerified: z.boolean(),
    }),
    execute: async ({ context }) => {
        return await getContractSourceCode(context.triggerData.address, context.triggerData.network);
    },
});

const stepTwo = new Step({
    id: "stepTwo",
    outputSchema: z.object({
        stateChange: z.array(
            z.object({
                stateVariable: z.string(),
                oldValue: z.string(),
                newValue: z.string(),
            })
        ),
        potentialIssues: z.array(z.string()),
        score: z.number(),
    }),
    execute: async ({ context }) => {
        const result = context.getStepResult(stepOne);
        if (!result.success) {
            return {
                stateChange: [],
                potentialIssues: [`Failed to get contract source code: ${result.result}`],
                score: 0,
            };
        }

        // Use a simpler CoreMessage format
        const message = {
            role: "user",
            content: result.result, // The contract source code
        };

        // Call the agent with the messages array
        const agentResponse = await analyzeContractAgent.generate({
            messages: [message],
        });

        return agentResponse.output || agentResponse; // Adjust based on response structure
    },
});

myWorkflow.step(stepOne).then(stepTwo).commit();