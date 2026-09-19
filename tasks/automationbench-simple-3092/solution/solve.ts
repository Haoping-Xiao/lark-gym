import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  [
    'sheets',
    '+cells-get',
    '--spreadsheet-token',
    'ss_assignments',
    '--sheet-id',
    'ws_clients',
    '--range',
    'A1:D4',
  ],
  ['im', '+chat-list', '--types=p2p,group'],
  [
    'im',
    '+messages-send',
    '--chat-id',
    'oc_U001',
    '--text',
    'Sarah，Orion Enterprises要求本周安排一次合同评审会议，请协调时间。',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
