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
    '{"collection": "posts", "channel_id": "ch_twitter", "scheduled_at": "2026-02-26T09:00:00Z", "text": "欢迎参加Scaling Your Business with AI Automation！3月12日美东时间下午1点，报名：brightpath.example.com/webinar-ai。"}',
  ],
  [
    'base',
    '+record-upsert',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_crm',
    '--json',
    '{"collection": "posts", "channel_id": "ch_linkedin", "scheduled_at": "2026-02-26T09:00:00Z", "text": "欢迎参加Scaling Your Business with AI Automation！3月12日美东时间下午1点，报名：brightpath.example.com/webinar-ai。"}',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
