import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  ['base', '+record-list', '--base-token', 'base_crm', '--table-id', 'tbl_crm'],
  [
    'base',
    '+record-upsert',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_crm',
    '--record-id',
    'rec_003201',
    '--json',
    '{"title": "VP of Operations"}',
  ],
  ['im', '+chat-list', '--types=p2p,group'],
  [
    'im',
    '+messages-send',
    '--chat-id',
    'oc_CSALES01',
    '--text',
    'Riley Thompson 的职位已更新为 VP of Operations。',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
