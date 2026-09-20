import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  [
    'sheets',
    '+cells-get',
    '--spreadsheet-token',
    'ss_leads',
    '--sheet-id',
    'ws_leads',
    '--range',
    'A1:D4',
  ],
  [
    'sheets',
    '+cells-set',
    '--spreadsheet-token',
    'ss_leads',
    '--sheet-id',
    'ws_leads',
    '--range',
    'D3',
    '--cells',
    '[[{"value": "Qualified"}]]',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
