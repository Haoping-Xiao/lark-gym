import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  [
    'mail',
    '+messages',
    '--mailbox',
    'agent@company.example.com',
    '--message-ids',
    'msg_4206',
    '--as',
    'user',
  ],
  [
    'base',
    '+record-list',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_6ac9a32c0ca8',
  ],
  [
    'base',
    '+record-list',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_4ff873f55e54',
  ],
  [
    'base',
    '+record-upsert',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_6ac9a32c0ca8',
    '--json',
    '{"board": "brd_mktg", "name": "Action items from manager feedback", "list": "lst_todo", "description": "更新3月社交媒体日历；修订邮件简报模板；安排与设计团队的评审会议。"}',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
