import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  ['im', '+chat-messages-list', '--chat-id', 'oc_updates'],
  [
    'base',
    '+record-list',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_02e3fe5aad80',
  ],
  [
    'base',
    '+record-upsert',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_02e3fe5aad80',
    '--json',
    '{"project": "PLAT", "issue_type": "Bug", "summary": "CSV upload 大文件超时", "description": "Hi, when we try to upload CSV files larger than 50MB, the upload hangs and eventually times out. Browser: Chrome 120. OS: macOS. Regards, Sam"}',
  ],
  ['im', '+chat-list', '--types=p2p,group'],
  [
    'im',
    '+messages-send',
    '--chat-id',
    'oc_CENG001',
    '--text',
    '已创建 PLAT Bug：CSV upload 超过 50MB 时挂起并超时。',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
