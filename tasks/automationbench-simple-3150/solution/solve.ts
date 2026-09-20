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
    '{"collection": "registration", "name": "Customer Training Session", "registration_enabled": "true"}',
  ],
  [
    'calendar',
    'events',
    'create',
    '--calendar-id',
    'cal_primary',
    '--data',
    '{"summary": "Customer Training Session", "start_time": {"timestamp": "1773327600"}, "end_time": {"timestamp": "1773334800"}, "vc_data": {"vc_type": "vc", "meeting_settings": {"join_meeting_permission": "only_event_attendees"}}}',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
