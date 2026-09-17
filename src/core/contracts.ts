export type Json =
  null | boolean | number | string | Json[] | { [key: string]: Json };
export type World = Record<string, unknown>;
export interface ApiCall {
  seq: number;
  method: string;
  path: string;
  body: unknown;
  status: number;
  response: unknown;
  changed: boolean;
  mutations?: { kind: string; id: string; before?: unknown; after: unknown }[];
}
export interface Backend {
  url: string;
  world: World;
  calls: ApiCall[];
  close(): Promise<void>;
}
export interface Verdict {
  status: 'pass' | 'fail' | 'environment_incomplete';
  success: boolean;
  checks: Record<string, boolean>;
  unsupported: string[];
  infrastructureErrors: number;
  apiCalls: number;
}
export type CliInvoker = (
  args: string[],
) => Promise<{ stdout: string; stderr: string }>;
export interface TaskDefinition {
  id: string;
  directory: string;
  validateSeed(input: unknown): World;
  createBackend(seed: World): Promise<Backend>;
  verify(seed: World, world: World, calls: ApiCall[]): Verdict;
  oracle(cli: CliInvoker): Promise<void>;
}
export interface AgentContext {
  workspace: string;
  output: string;
  prompt: string;
  endpoint: string;
  cliBinary: string;
  timeoutMs: number;
  model?: string;
  signal: AbortSignal;
}
export interface AgentResult {
  completed: boolean;
  commands: number;
  threadId: string | null;
  usage: unknown;
  failure: string | null;
}
export interface AgentAdapter {
  run(context: AgentContext): Promise<AgentResult>;
}
