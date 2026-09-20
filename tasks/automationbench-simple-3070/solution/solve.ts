import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  ['im', '+chat-list', '--types=p2p,group'],
  [
    'im',
    '+messages-send',
    '--chat-id',
    'oc_recipient',
    '--text',
    'Your BrightPath Contract Renewal - Action Required\nBen，你的年度合同于2026年3月31日到期，3月15日前签署可享10%提前续约优惠。办理地址：renewals.brightpath.example.com。',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
