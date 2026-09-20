import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  [
    'sheets',
    '+cells-get',
    '--spreadsheet-token',
    'ss_status',
    '--sheet-id',
    'ws_report',
    '--range',
    'A1:D4',
  ],
  [
    'sheets',
    '+cells-set',
    '--spreadsheet-token',
    'ss_status',
    '--sheet-id',
    'ws_report',
    '--range',
    'C2',
    '--cells',
    '[[{"value": "Completed"}]]',
  ],
  [
    'sheets',
    '+cells-set',
    '--spreadsheet-token',
    'ss_status',
    '--sheet-id',
    'ws_report',
    '--range',
    'C3',
    '--cells',
    '[[{"value": "In Progress"}]]',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
