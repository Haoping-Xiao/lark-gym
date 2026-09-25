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
    '{"channel_id": "ch_twitter", "scheduled_at": "2026-03-02T09:00:00Z", "text": "BrightPath将参加3月18—20日在旧金山举行的SaaStr Annual 2026，展位412。预约演示：brightpath.example.com/saastr。"}',
  ],
  [
    'base',
    '+record-upsert',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_a44f1b975171',
    '--json',
    '{"channel_id": "ch_linkedin", "scheduled_at": "2026-03-02T09:00:00Z", "text": "BrightPath将参加3月18—20日在旧金山举行的SaaStr Annual 2026，展位412。预约演示：brightpath.example.com/saastr。"}',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
