import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  ['im', '+chat-list', '--types=p2p,group'],
  [
    'im',
    '+messages-send',
    '--chat-id',
    'oc_U001',
    '--text',
    'Sarah，提醒你明天下午2点与Globex Financial开客户会议，请带上更新后的方案演示文稿和Q4指标报告。',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
