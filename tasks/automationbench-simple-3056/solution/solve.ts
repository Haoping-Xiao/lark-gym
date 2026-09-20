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
    '--json',
    '{"collection": "posts", "channel_id": "ch_twitter", "scheduled_at": "2026-02-25T09:00:00Z", "text": "Meridian Health CTO Priya Sharma：BrightPath\'s automation platform cut our onboarding time by 60% and our team couldn\'t be happier."}',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
