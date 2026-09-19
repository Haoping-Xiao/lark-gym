import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  [
    'calendar',
    'events',
    'create',
    '--calendar-id',
    'cal_primary',
    '--data',
    '{"summary": "Daily Standup", "start_time": {"timestamp": "1772461800", "timezone": "America/New_York"}, "end_time": {"timestamp": "1772465400", "timezone": "America/New_York"}, "recurrence": "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR", "vc_data": {"vc_type": "vc", "meeting_settings": {}}}',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
