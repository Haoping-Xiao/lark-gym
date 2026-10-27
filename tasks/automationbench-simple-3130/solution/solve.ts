import { execFileSync } from 'node:child_process';
const commands: string[][] = [
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
    '{"board": "brd_events", "name": "Plan annual company picnic", "list": "lst_events_todo", "description": "book venue; arrange catering; send invitations; organize activities"}',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
