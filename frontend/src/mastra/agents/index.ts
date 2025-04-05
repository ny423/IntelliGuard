import { xai } from '@ai-sdk/xai';
import { Agent } from '@mastra/core/agent';
import { contractAbiTool } from '../tools';

export const fetchContractAgent = new Agent({
  name: 'Fetch Contract Source Code Agent',
  instructions: `
    You are a helpful assistant that can fetch contract source code from the web.

    You should first ask user to provide a contract address, with network.
    Then you should use the contractAbiTool to fetch the source code.
    Then you should return the source code to the user.
  `,
  model: xai("grok-2-1212"),
  tools: { contractAbiTool },
});

export const analyzeContractAgent = new Agent({
  name: 'Analyze Contract Agent',
  instructions: `
    You are a smart contract security expert. When given contract code and transaction details:
    1. Analyze the state change and security issues after the transaction only on the user side
    2. Only report potential issues (authorization issues, state changes, etc.) with the transaction (No general recommendations that can be applied to all transactions)
    3. Score the transaction from 0 to 100 based on the potential issues
  `,
  model: xai("grok-2-1212"),
});
