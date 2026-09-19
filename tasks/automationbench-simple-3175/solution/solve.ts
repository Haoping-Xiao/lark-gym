import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  ['base', '+record-list', '--base-token', 'base_crm', '--table-id', 'tbl_crm'],
  ['im', '+chat-list', '--types=p2p,group'],
  [
    'im',
    '+messages-send',
    '--chat-id',
    'oc_CGEN01',
    '--text',
    'CloudSync Pro 今天正式发布！',
  ],
  [
    'im',
    '+messages-send',
    '--chat-id',
    'oc_notice_1',
    '--text',
    'CloudSync Pro Launch\nCloudSync Pro 今天正式发布！',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
