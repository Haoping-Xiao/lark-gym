import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  ['im', '+chat-list', '--types=p2p,group'],
  [
    'im',
    '+messages-send',
    '--chat-id',
    'oc_U003',
    '--text',
    'Lisa，CRM迁移已完成90%，预计按3月5日截止时间完成。唯一剩余风险是数据校验步骤，本周正在测试。',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
