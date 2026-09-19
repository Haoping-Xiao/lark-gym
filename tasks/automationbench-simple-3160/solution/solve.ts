import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  ['im', '+chat-messages-list', '--chat-id', 'oc_updates'],
  ['base', '+record-list', '--base-token', 'base_crm', '--table-id', 'tbl_crm'],
  [
    'base',
    '+record-upsert',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_crm',
    '--json',
    '{"collection": "contacts", "first_name": "Casey", "last_name": "Morgan", "email": "casey.morgan@company.example.com", "title": "Senior Developer", "company": "Acme Corp"}',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
