import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  [
    'calendar',
    'events',
    'create',
    '--calendar-id',
    'cal_primary',
    '--data',
    '{"summary": "Quarterly Review with Orion Corp", "start_time": {"timestamp": "1772186400"}, "end_time": {"timestamp": "1772190000"}, "vc_data": {"vc_type": "vc", "meeting_settings": {}}}',
  ],
  ['im', '+chat-list', '--types=p2p,group'],
  [
    'im',
    '+messages-send',
    '--chat-id',
    'oc_notice_0',
    '--text',
    'Quarterly Review with Orion Corp\n邀请您参加 2026-02-27 10:00 UTC 会议，时长 60 分钟。',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
