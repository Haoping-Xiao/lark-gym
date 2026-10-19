import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  [
    'mail',
    '+messages',
    '--mailbox',
    'ap@company.example.com',
    '--message-ids',
    'msg_3192',
    '--as',
    'user',
  ],
  [
    'base',
    '+record-list',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_b80355750958',
  ],
  [
    'base',
    '+record-upsert',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_b80355750958',
    '--json',
    '{"Vendor": "CloudHost", "Amount": 4500}',
  ],
  ['im', '+chat-list', '--types=p2p,group'],
  [
    'im',
    '+messages-send',
    '--chat-id',
    'oc_CFIN01',
    '--text',
    '已登记 CloudHost invoice CH-2026-0089，金额 $4,500。',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
