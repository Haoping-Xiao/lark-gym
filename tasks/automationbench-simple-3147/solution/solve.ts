import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  [
    'calendar',
    'events',
    'create',
    '--calendar-id',
    'cal_primary',
    '--data',
    '{"summary": "Vendor Onboarding Call", "start_time": {"timestamp": "1773158400"}, "end_time": {"timestamp": "1773162000"}, "vc_data": {"vc_type": "vc", "meeting_settings": {}}}',
  ],
  ['im', '+chat-list', '--types=p2p,group'],
  [
    'im',
    '+messages-send',
    '--chat-id',
    'oc_ch_vendor',
    '--text',
    'Vendor Onboarding Call 飞书视频会议定于2026-03-10 16:00 UTC开始，持续1小时。',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
