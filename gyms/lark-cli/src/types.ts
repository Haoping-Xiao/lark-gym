// API payloads have endpoint-specific shapes; validation occurs before writes.
export type ApiObject = Record<string, any>;
export interface BaseRecord {
  record_id: string;
  fields: Record<string, string | number>;
}
export interface Sheet {
  title: string;
  values: (string | number | boolean)[][];
}
export interface World {
  [key: string]: any;
  now: string;
  spreadsheet_token: string;
  spreadsheet_title?: string;
  sheets: Record<string, Sheet>;
  spreadsheets?: Record<
    string,
    { title: string; sheets: Record<string, Sheet> }
  >;
  calendars: ApiObject[];
  events: (ApiObject & { event_id: string; summary: string })[];
  base: {
    app_token: string;
    table_id: string;
    records: BaseRecord[];
    fields?: { name: string; type: string }[];
  };
  chats: (ApiObject & { chat_id: string; name: string })[];
  chat_creation_allowed?: boolean;
  messages: (ApiObject & { message_id: string; chat_id: string })[];
}
export interface ApiCall {
  seq: number;
  method: string;
  path: string;
  body: ApiObject;
  status: number;
  response: unknown;
  changed: boolean;
  mutations: { kind: string; id: string; before?: unknown; after: unknown }[];
}
export interface MockOptions {
  host?: string;
  port?: number;
  onSnapshot?: (world: World, calls: ApiCall[]) => void;
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
