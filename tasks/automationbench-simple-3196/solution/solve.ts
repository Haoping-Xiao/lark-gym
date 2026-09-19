import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  ['im', '+chat-messages-list', '--chat-id', 'oc_updates'],
  [
    'calendar',
    'events',
    'create',
    '--calendar-id',
    'cal_primary',
    '--data',
    '{"summary": "Product Demo - Cascade Solutions", "start_time": {"timestamp": "1772290800"}, "end_time": {"timestamp": "1772292600"}, "vc_data": {"vc_type": "vc", "meeting_settings": {}}}',
  ],
  ['im', '+chat-list', '--types=p2p,group'],
  [
    'im',
    '+messages-send',
    '--chat-id',
    'oc_notice_0',
    '--text',
    'Re: Demo Request: Cascade Solutions\nProduct Demo - Cascade Solutions 演示安排：2026-02-28 15:00 UTC，30 分钟。',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
