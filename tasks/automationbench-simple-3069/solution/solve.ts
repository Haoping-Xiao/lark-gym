import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  ['im', '+chat-list', '--types=p2p,group'],
  [
    'im',
    '+messages-send',
    '--chat-id',
    'oc_recipient',
    '--text',
    "Welcome to BrightPath! Let's Get Started\nFatima，你的账户已激活，可登录app.brightpath.example.com。入职培训定于3月3日美东时间上午11点，专属客户成功经理为Olivia Park。",
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
