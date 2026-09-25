// API payloads have endpoint-specific shapes; validation occurs before writes.
export type ApiObject = Record<string, any>;
export interface BaseRecord {
  record_id: string;
  fields: Record<string, string | number>;
}
export interface Sheet {
  title: string;
  values: (string | number | boolean)[][];
  // Reviewed text number format, keyed by zero-based row:column coordinates.
  cell_styles?: Record<string, { number_format: '@' }>;
}
export interface World {
  [key: string]: any;
  now: string;
  mail?: {
    mailboxes: {
      email_address: string;
      email_type?: 'USER_PRIMARY' | 'PUBLIC_MAILBOX';
    }[];
    messages: (ApiObject & { message_id: string; mailbox_id: string })[];
    drafts: { id: string; message_id: string; mailbox_id: string }[];
  };
  spreadsheet_token: string;
  spreadsheet_title?: string;
  sheets: Record<string, Sheet>;
  spreadsheets?: Record<
    string,
    { title: string; sheets: Record<string, Sheet> }
  >;
  // Absent means no comments in this fixture, not an alternate response cache.
  drive_comments?: (ApiObject & {
    file_token: string;
    file_type: string;
    comment_id: string;
    is_solved: boolean;
    is_whole: boolean;
    reply_list?: { replies: ApiObject[] };
  })[];
  // Spaces accessible to this fixture's evaluation identity; absence means none.
  wiki_spaces?: {
    space_id: string;
    name: string;
    description: string;
    space_type: 'team' | 'person' | 'my_library' | 'my_library_resigned';
    visibility: 'public' | 'private';
    open_sharing: 'open' | 'closed';
  }[];
  calendars: ApiObject[];
  events: (ApiObject & { event_id: string; summary: string })[];
  base: {
    name?: string;
    app_token: string;
    table_id: string;
    records: BaseRecord[];
    fields?: { name: string; type: string }[];
    tables?: {
      table_id: string;
      name: string;
      collection: string;
      read_only?: boolean;
      fields: { name: string; type: string }[];
    }[];
  };
  chats: (ApiObject & { chat_id: string; name: string })[];
  chat_creation_allowed?: boolean;
  messages: (ApiObject & { message_id: string; chat_id: string })[];
}
export interface ApiCall {
  identity?: 'user' | 'bot';
  seq: number;
  method: string;
  path: string;
  body: ApiObject;
  status: number;
  response: unknown;
  changed: boolean;
  timestamp?: string;
  unsupported?: Record<string, unknown>;
  mutations: { kind: string; id: string; before?: unknown; after: unknown }[];
}
export interface MockOptions {
  host?: string;
  port?: number;
  onSnapshot?: (world: World, calls: ApiCall[]) => void;
  onUnsupported?: (call: ApiCall) => Record<string, unknown>;
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
