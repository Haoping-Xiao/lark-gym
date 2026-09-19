import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  ['base', '+record-list', '--base-token', 'base_crm', '--table-id', 'tbl_crm'],
  [
    'base',
    '+record-upsert',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_crm',
    '--json',
    '{"collection": "issues", "project": "DEVOPS", "issuetype": "Task", "summary": "Update CI/CD pipeline for new deployment"}',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
