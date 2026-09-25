import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  [
    'mail',
    '+messages',
    '--mailbox',
    'cs@company.example.com',
    '--message-ids',
    'msg_3183',
    '--as',
    'user',
  ],
  [
    'base',
    '+record-list',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_aabe76f1f4ec',
  ],
  [
    'base',
    '+record-upsert',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_aabe76f1f4ec',
    '--json',
    '{"Name": "Lucas Grant", "Company": "Pinnacle Dynamics"}',
  ],
  [
    'mail',
    '+send',
    '--to',
    'lucas.grant@pinnacle.example.com',
    '--subject',
    'Welcome to our service',
    '--body',
    '欢迎 Pinnacle Dynamics 的 Lucas Grant！',
    '--confirm-send',
    '--as',
    'user',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
