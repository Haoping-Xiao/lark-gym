import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  ['im', '+chat-messages-list', '--chat-id', 'oc_updates'],
  ['base', '+record-list', '--base-token', 'base_crm', '--table-id', 'tbl_crm'],
  [
    'base',
    '+record-upsert',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_crm',
    '--json',
    '{"collection": "issues", "project": "PROD", "issue_type": "Story", "summary": "bulk export 功能反馈", "description": "Hi, it would be really helpful if we could bulk export all records as CSV with custom column selection. Currently we have to export one page at a time. Thanks, Yuki Tanaka"}',
  ],
  ['im', '+chat-list', '--types=p2p,group'],
  [
    'im',
    '+messages-send',
    '--chat-id',
    'oc_notice_0',
    '--text',
    'Re: Suggestion: Bulk export feature\n感谢您的功能反馈！',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
