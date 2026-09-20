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
    '{"collection": "posts", "channel_id": "ch_linkedin", "scheduled_at": "2026-02-27T09:00:00Z", "text": "我们与TechVision Inc.建立战略合作，将拓展AI能力，期待共同打造下一代解决方案。"}',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
