import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  [
    'mail',
    '+messages',
    '--mailbox',
    'agent@company.example.com',
    '--message-ids',
    'Zml4dHVyZTptc2dfZXhlY19wcm90b2NvbF9vcHM,Zml4dHVyZTptc2dfZXhlY19wcm90b2NvbF92cA,Zml4dHVyZTptc2dfc2FtZV9zZW5kZXJfMDBfMDA,Zml4dHVyZTptc2dfc2FtZV9zZW5kZXJfMDBfMDE,Zml4dHVyZTptc2dfc2FtZV9zZW5kZXJfMDFfMDA,Zml4dHVyZTptc2dfc2FtZV9zZW5kZXJfMDFfMDE,Zml4dHVyZTptc2dfc2FtZV9zZW5kZXJfMDFfMDI,Zml4dHVyZTptc2dfbm9pc2VfMDIw,Zml4dHVyZTptc2dfbm9pc2VfMDM2,Zml4dHVyZTptc2dfbm9pc2VfMDIy,Zml4dHVyZTptc2dfbm9pc2VfMDE2,Zml4dHVyZTptc2dfbm9pc2VfMDA1,Zml4dHVyZTptc2dfbm9pc2VfMDMy,Zml4dHVyZTptc2dfbm9pc2VfMDI2,Zml4dHVyZTptc2dfbm9pc2VfMDM1,Zml4dHVyZTptc2dfbm9pc2VfMDEy,Zml4dHVyZTptc2dfbm9pc2VfMDQy,Zml4dHVyZTptc2dfbm9pc2VfMDAx,Zml4dHVyZTptc2dfbm9pc2VfMDE4,Zml4dHVyZTptc2dfbm9pc2VfMDQ1,Zml4dHVyZTptc2dfbm9pc2VfMDMx,Zml4dHVyZTptc2dfbm9pc2VfMDA0,Zml4dHVyZTptc2dfbm9pc2VfMDQ4,Zml4dHVyZTptc2dfbm9pc2VfMDAz,Zml4dHVyZTptc2dfbm9pc2VfMDA3,Zml4dHVyZTptc2dfbm9pc2VfMDI1,Zml4dHVyZTptc2dfbm9pc2VfMDI4,Zml4dHVyZTptc2dfbm9pc2VfMDIx,Zml4dHVyZTptc2dfbm9pc2VfMDA4,Zml4dHVyZTptc2dfbm9pc2VfMDEw,Zml4dHVyZTptc2dfbm9pc2VfMDM5,Zml4dHVyZTptc2dfbm9pc2VfMDMz,Zml4dHVyZTptc2dfbm9pc2VfMDMw,Zml4dHVyZTptc2dfbm9pc2VfMDE1,Zml4dHVyZTptc2dfbm9pc2VfMDM3,Zml4dHVyZTptc2dfbm9pc2VfMDQz,Zml4dHVyZTptc2dfbm9pc2VfMDA5,Zml4dHVyZTptc2dfbm9pc2VfMDE5,Zml4dHVyZTptc2dfbm9pc2VfMDE3,Zml4dHVyZTptc2dfbm9pc2VfMDEx,Zml4dHVyZTptc2dfbm9pc2VfMDI5,Zml4dHVyZTptc2dfbm9pc2VfMDE0,Zml4dHVyZTptc2dfbm9pc2VfMDA2,Zml4dHVyZTptc2dfbm9pc2VfMDQ3,Zml4dHVyZTptc2dfbm9pc2VfMDQ2,Zml4dHVyZTptc2dfbm9pc2VfMDQ5,Zml4dHVyZTptc2dfbm9pc2VfMDIz,Zml4dHVyZTptc2dfbm9pc2VfMDQx,Zml4dHVyZTptc2dfbm9pc2VfMDI3,Zml4dHVyZTptc2dfbm9pc2VfMDI0,Zml4dHVyZTptc2dfbm9pc2VfMDEz,Zml4dHVyZTptc2dfbm9pc2VfMDM0',
    '--as',
    'user',
  ],
  [
    'base',
    '+record-list',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_bc62a3c14fec',
  ],
  [
    'base',
    '+record-list',
    '--base-token',
    'base_crm',
    '--table-id',
    'tbl_aa5af4084f37',
  ],
  [
    'mail',
    '+send',
    '--mailbox',
    'agent@company.example.com',
    '--to',
    'r.anderson@apexmfg.example.com',
    '--subject',
    'Security advisory',
    '--body',
    'Security advisory\nRobert Anderson，现向您转达 Apex Manufacturing 的安全提示，请协调相关安全事项。',
    '--confirm-send',
    '--as',
    'user',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
