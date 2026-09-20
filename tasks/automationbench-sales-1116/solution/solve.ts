import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  ['im', '+chat-messages-list', '--chat-id', 'oc_mail'],
  ['base', '+record-list', '--base-token', 'base_crm', '--table-id', 'tbl_crm'],
  [
    'base',
    '+record-upsert',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_crm',
    '--record-id',
    'rec_006_APEX',
    '--json',
    '{"description": "QBR | APAC expansion | 3 action items | Jan 20 amendment applied"}',
  ],
  [
    'base',
    '+record-upsert',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_crm',
    '--json',
    '{"collection": "tasks", "subject": "Send updated pricing proposal", "owner_id": "005_DAVE", "what_id": "006_APEX", "due_date": "2024-01-22", "status": "Not Started"}',
  ],
  [
    'base',
    '+record-upsert',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_crm',
    '--json',
    '{"collection": "tasks", "subject": "Schedule technical deep-dive", "owner_id": "005_ALICE", "what_id": "006_APEX", "due_date": "2024-01-25", "status": "Not Started"}',
  ],
  [
    'base',
    '+record-upsert',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_crm',
    '--json',
    '{"collection": "tasks", "subject": "Prepare ROI analysis", "owner_id": "005_CAROL", "what_id": "006_APEX", "due_date": "2024-01-24", "status": "Not Started"}',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
