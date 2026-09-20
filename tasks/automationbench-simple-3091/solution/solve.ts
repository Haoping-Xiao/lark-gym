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
  ['im', '+chat-list', '--types=p2p,group'],
  [
    'im',
    '+messages-send',
    '--chat-id',
    'oc_contact_0',
    '--text',
    'Introducing BrightPath - Workflow Automation\nNina，你好！BrightPath 自动化平台可以帮助团队连接办公流程，减少重复操作。期待与你交流。',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
