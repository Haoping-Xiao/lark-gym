import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  ['im', '+chat-list', '--types=p2p,group'],
  [
    'im',
    '+messages-send',
    '--chat-id',
    'oc_CMETRICS',
    '--text',
    '本周指标：新增注册342，试用转化28，月经常性收入$1.24M（增长3.2%），流失率1.8%，已解决支持工单156。',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
