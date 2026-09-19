import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  [
    'calendar',
    'events',
    'create',
    '--calendar-id',
    'cal_primary',
    '--data',
    '{"summary": "Board of Directors Meeting", "start_time": {"timestamp": "1774018800"}, "end_time": {"timestamp": "1774026000"}, "vc_data": {"vc_type": "vc", "meeting_settings": {"password": "428615"}}}',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
