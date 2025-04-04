import { Mastra } from '@mastra/core/mastra';
import { createLogger } from '@mastra/core/logger';

import { fetchContractAgent, analyzeContractAgent } from './agents';
import { multiAgentWorkflow } from './workflow/multi-agent-workflow';
export const mastra = new Mastra({
  agents: { fetchContractAgent, analyzeContractAgent },
  workflows: { multiAgentWorkflow },
  logger: createLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
