import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  [
    'calendar',
    'events',
    'create',
    '--calendar-id',
    'cal_primary',
    '--data',
    '{"summary": "Sales Pipeline Review", "start_time": {"timestamp": "1772136000"}, "end_time": {"timestamp": "1772138700"}, "vc_data": {"vc_type": "vc", "meeting_settings": {}}}',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
