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
    '{"channel_id": "ch_twitter", "scheduled_at": "2026-02-25T09:00:00Z", "text": "NexGen 2.0 Launch将于2月28日美东时间下午2点举行，报名：nexgen.example.com/launch。"}',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
