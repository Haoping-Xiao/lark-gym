import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  ['im', '+chat-messages-list', '--chat-id', 'oc_updates'],
  [
    'sheets',
    '+cells-get',
    '--spreadsheet-token',
    'ss_projects',
    '--sheet-id',
    'sheet1',
    '--range',
    'A1:C1',
  ],
  [
    'sheets',
    '+cells-set',
    '--spreadsheet-token',
    'ss_projects',
    '--sheet-id',
    'sheet1',
    '--range',
    'A2',
    '--cells',
    '[[{"value": "Mobile App v2"}]]',
  ],
  [
    'sheets',
    '+cells-set',
    '--spreadsheet-token',
    'ss_projects',
    '--sheet-id',
    'sheet1',
    '--range',
    'B2',
    '--cells',
    '[[{"value": "Phase 2 Complete"}]]',
  ],
  ['im', '+chat-list', '--types=p2p,group'],
  [
    'im',
    '+messages-send',
    '--chat-id',
    'oc_notice_0',
    '--text',
    'Re: Project Update: Mobile App v2 Phase 2 Complete\n已记录 Phase 2 Complete，下一步下周开始 Phase 3。',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
