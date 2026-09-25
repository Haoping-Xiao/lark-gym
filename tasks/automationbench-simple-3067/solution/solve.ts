import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  [
    'mail',
    '+send',
    '--to',
    'rachel.kim@globexfin.example.com',
    '--subject',
    'Invoice #INV-2026-0342 - February Services',
    '--body',
    'Hi Rachel, attached is invoice INV-2026-0342 for $12,500 for February consulting services. Payment terms are Net 30. Please see invoice_INV-2026-0342.pdf.',
    '--attach',
    'invoice_INV-2026-0342.pdf',
    '--confirm-send',
    '--as',
    'user',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
