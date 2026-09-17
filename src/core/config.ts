import { z } from 'zod';
export const configSchema = z
  .object({
    task: z.string().min(1),
    agent: z.enum(['codex', 'oracle']).default('codex'),
    timeoutMs: z.number().int().min(1000).max(3600000).default(600000),
    model: z.string().optional(),
    outputDir: z.string().default('runs'),
    cliBinary: z.string().default('gyms/lark-cli/bin/lark-cli'),
  })
  .strict();
export type RunConfig = z.infer<typeof configSchema>;
