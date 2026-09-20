import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  ['im', '+chat-list', '--types=p2p,group'],
  [
    'im',
    '+messages-send',
    '--chat-id',
    'oc_recipient',
    '--text',
    'Great connecting today - BrightPath Demo Follow-up\nDerek，感谢你今天抽时间参加演示。我们展示了工作流自动化和报表仪表盘，将在本周末前发送方案。',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
