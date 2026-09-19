import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  ['base', '+record-list', '--base-token', 'base_crm', '--table-id', 'tbl_crm'],
  ['im', '+chat-list', '--types=p2p,group'],
  [
    'im',
    '+messages-send',
    '--chat-id',
    'oc_notice_0',
    '--text',
    'Weekly Digest - Feb 23\nAlice Fernandez，本周亮点：暂无可核实的业务进展。',
  ],
  [
    'im',
    '+messages-send',
    '--chat-id',
    'oc_notice_1',
    '--text',
    'Weekly Digest - Feb 23\nBob Nguyen，本周亮点：暂无可核实的业务进展。',
  ],
  [
    'im',
    '+messages-send',
    '--chat-id',
    'oc_notice_2',
    '--text',
    'Weekly Digest - Feb 23\nClara Singh，本周亮点：暂无可核实的业务进展。',
  ],
  [
    'im',
    '+messages-send',
    '--chat-id',
    'oc_notice_3',
    '--text',
    'Weekly Digest - Feb 23\nDan Mueller，本周亮点：暂无可核实的业务进展。',
  ],
  [
    'im',
    '+messages-send',
    '--chat-id',
    'oc_notice_4',
    '--text',
    'Weekly Digest - Feb 23\nEva Kowalski，本周亮点：暂无可核实的业务进展。',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
