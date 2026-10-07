import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  [
    'mail',
    '+messages',
    '--mailbox',
    'product@company.example.com',
    '--message-ids',
    'msg_3157',
    '--as',
    'user',
  ],
  [
    'base',
    '+record-list',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_085154084c74',
  ],
  [
    'base',
    '+record-upsert',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_085154084c74',
    '--json',
    '{"name": "评审 PDF 导出需求", "description": "Hi team, it would be great if we could export reports to PDF directly from the dashboard. This would save us a lot of time. Thanks, Nina"}',
  ],
  [
    'mail',
    '+reply',
    '--mailbox',
    'product@company.example.com',
    '--message-id',
    'msg_3157',
    '--body',
    'Thanks for your feature request. We have received it and created a product review task.',
    '--confirm-send',
    '--as',
    'user',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
