import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  [
    'mail',
    '+messages',
    '--mailbox',
    'feedback@company.example.com',
    '--message-ids',
    'msg_3194',
    '--as',
    'user',
  ],
  [
    'base',
    '+record-list',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_02e3fe5aad80',
  ],
  [
    'base',
    '+record-upsert',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_02e3fe5aad80',
    '--json',
    '{"project": "PROD", "issue_type": "Story", "summary": "bulk export 功能反馈", "description": "Hi, it would be really helpful if we could bulk export all records as CSV with custom column selection. Currently we have to export one page at a time. Thanks, Yuki Tanaka"}',
  ],
  [
    'mail',
    '+reply',
    '--mailbox',
    'feedback@company.example.com',
    '--message-id',
    'msg_3194',
    '--body',
    'Thank you for your feature feedback. We have recorded your bulk export suggestion for review.',
    '--confirm-send',
    '--as',
    'user',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
