import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  ['im', '+chat-list', '--types=p2p,group'],
  [
    'im',
    '+messages-send',
    '--chat-id',
    'oc_U002',
    '--text',
    'Mike，请审查新webhook端点的API文档，本周五前完成。文档位于飞书共享资料的API Docs v3文件夹。',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
