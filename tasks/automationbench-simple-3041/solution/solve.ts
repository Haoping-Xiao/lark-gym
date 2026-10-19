import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  [
    'base',
    '+record-list',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_aa5af4084f37',
  ],
  [
    'base',
    '+record-upsert',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_aa5af4084f37',
    '--json',
    '{"firstname": "Olivia", "lastname": "Harper", "email": "olivia.harper@nexwave.example.com", "phone": "+1-555-4141", "company": "NexWave Solutions"}',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
