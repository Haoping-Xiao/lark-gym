import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  [
    'mail',
    '+messages',
    '--mailbox',
    'pm@brightpath.example.com',
    '--message-ids',
    'msg_8002',
    '--as',
    'user',
  ],
  [
    'sheets',
    '+cells-get',
    '--spreadsheet-token',
    'ss_project_status',
    '--sheet-id',
    'ws_projects',
    '--range',
    'A1:D3',
  ],
  [
    'sheets',
    '+cells-set',
    '--spreadsheet-token',
    'ss_project_status',
    '--sheet-id',
    'ws_projects',
    '--range',
    'C2',
    '--cells',
    '[[{"value": "Completed"}]]',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
