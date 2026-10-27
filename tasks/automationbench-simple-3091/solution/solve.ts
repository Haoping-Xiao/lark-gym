import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  [
    'sheets',
    '+cells-get',
    '--spreadsheet-token',
    'ss_outreach',
    '--sheet-id',
    'ws_pending',
    '--range',
    'A1:D4',
  ],
  [
    'mail',
    '+send',
    '--to',
    'nina.patel@clearviewsoftware.example.com',
    '--subject',
    'Introducing BrightPath - Workflow Automation',
    '--body',
    'Nina，你好！BrightPath 自动化平台帮助团队连接工作流程，减少重复操作。期待与你交流。',
    '--confirm-send',
    '--as',
    'user',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
