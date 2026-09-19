import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  ['im', '+chat-messages-list', '--chat-id', 'oc_updates'],
  ['im', '+chat-list', '--types=p2p,group'],
  [
    'im',
    '+messages-send',
    '--chat-id',
    'oc_CALLHANDS',
    '--text',
    'BrightPath完成由Sequoia Capital领投的7500万美元（$75 million）C轮融资，将加快产品路线图推进、扩充市场团队，并支持欧洲和亚太地区的国际扩张。',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
