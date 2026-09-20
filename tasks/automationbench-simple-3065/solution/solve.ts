import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  ['im', '+chat-messages-list', '--chat-id', 'oc_updates'],
  ['im', '+chat-list', '--types=p2p,group'],
  [
    'im',
    '+messages-send',
    '--chat-id',
    'oc_recipient',
    '--text',
    'Luis，Starter套餐为每用户每月$49，Professional套餐为每用户每月$99，Enterprise采用定制报价。企业咨询请在brightpath.example.com/pricing-call预约。',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
