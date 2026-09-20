import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  ['im', '+chat-list', '--types=p2p,group'],
  [
    'im',
    '+messages-send',
    '--chat-id',
    'oc_CMKTG001',
    '--text',
    'Spring Forward营销活动启动！活动时间3月1—31日，面向中型SaaS公司，覆盖邮件、社交媒体和付费广告。',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
