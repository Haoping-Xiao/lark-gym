import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  ['im', '+chat-messages-list', '--chat-id', 'oc_updates'],
  [
    'sheets',
    '+cells-get',
    '--spreadsheet-token',
    'ss_feedback',
    '--sheet-id',
    'sheet1',
    '--range',
    'A1:C1',
  ],
  [
    'sheets',
    '+cells-set',
    '--spreadsheet-token',
    'ss_feedback',
    '--sheet-id',
    'sheet1',
    '--range',
    'A2',
    '--cells',
    '[[{"value": "Tom Brennan"}]]',
  ],
  [
    'sheets',
    '+cells-set',
    '--spreadsheet-token',
    'ss_feedback',
    '--sheet-id',
    'sheet1',
    '--range',
    'C2',
    '--cells',
    '[[{"value": "Hi, I just wanted to say your new reporting feature is fantastic. It\'s saved our team hours every week. Keep up the great work! - Tom Brennan"}]]',
  ],
  ['im', '+chat-list', '--types=p2p,group'],
  [
    'im',
    '+messages-send',
    '--chat-id',
    'oc_notice_0',
    '--text',
    'Re: Customer Feedback: Great experience with your product\n感谢您的反馈！',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
