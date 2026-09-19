import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  [
    'calendar',
    'events',
    'create',
    '--calendar-id',
    'cal_primary',
    '--data',
    '{"summary": "Intro to AI Tools", "start_time": {"timestamp": "1773597600"}, "end_time": {"timestamp": "1773603000"}, "vc_data": {"vc_type": "vc", "meeting_settings": {}}}',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
