import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  ['im', '+chat-messages-list', '--chat-id', 'oc_mail'],
  ['base', '+record-list', '--base-token', 'base_crm', '--table-id', 'tbl_crm'],
  [
    'base',
    '+record-upsert',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_crm',
    '--json',
    '{"collection": "signature_requests", "template_id": "tmpl_partnership", "template_name": "Partnership Agreement", "account_id": "001xx000004ACC1", "opportunity_id": "006xx000006OPP1", "recipient_email": "emily.watson@acme.example.com", "status": "Sent", "amount": 450000, "subject": "Partnership Agreement - $450,000", "deadline": "2024-03-13", "revenue_share": "70/30", "territory": "North America exclusive", "term": "2 years with auto-renewal"}',
  ],
  [
    'im',
    '+messages-send',
    '--chat-id',
    'oc_email_35',
    '--text',
    'Partnership Agreement - $450,000\nAcme | 经批准金额$450,000；请确认70/30、North America exclusive、2 years with auto-renewal条款并于2024-03-13前签署。此为签署请求，未声称已签。',
  ],
  [
    'base',
    '+record-upsert',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_crm',
    '--record-id',
    'rec_006xx000006OPP1',
    '--json',
    '{"amount": 450000, "stage_name": "Contract Sent", "description": "Approved $450,000 used; customer request $750,000 not approved | Emily Watson | Partnership Agreement | deadline 2024-03-13 | 70/30 | North America exclusive | 2 years with auto-renewal"}',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
