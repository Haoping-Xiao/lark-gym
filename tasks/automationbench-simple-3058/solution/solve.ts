import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  [
    'base',
    '+record-list',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_61ffa9c8c703',
  ],
  [
    'base',
    '+record-list',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_a44f1b975171',
  ],
  [
    'base',
    '+record-upsert',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_a44f1b975171',
    '--json',
    '{"channel_id": "ch_facebook", "scheduled_at": "2026-02-27T15:00:00Z", "text": "BrightPath入选2025年Forbes Cloud 100榜单！感谢团队与客户一路支持。"}',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
