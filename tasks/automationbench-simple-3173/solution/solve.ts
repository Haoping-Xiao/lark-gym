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
    '{"collection": "tasks", "name": "Plan Annual Company Retreat", "workspace": "ws_ops"}',
  ],
  [
    'calendar',
    'events',
    'create',
    '--calendar-id',
    'cal_primary',
    '--data',
    '{"summary": "Company Retreat Planning Kickoff", "start_time": {"timestamp": "1772708400"}, "end_time": {"timestamp": "1772712000"}}',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
