import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  ['im', '+chat-messages-list', '--chat-id', 'oc_updates'],
  ['im', '+chat-list', '--types=p2p,group'],
  [
    'im',
    '+messages-send',
    '--chat-id',
    'oc_CSUPPORT',
    '--text',
    '紧急告警：Veronica Steele反馈生产环境数据同步（data sync）自今天早上6点起失败，集成流水线报错、客户记录无法更新，已阻塞运营团队，请立即升级处理。',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
