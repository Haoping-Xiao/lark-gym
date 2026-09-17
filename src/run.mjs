import { readFile,writeFile,mkdir,symlink,mkdtemp,appendFile } from 'node:fs/promises';
import { resolve,dirname,join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { Codex } from '@openai/codex-sdk';
import { startMock } from './mock.mjs';
import { verify } from './verify.mjs';
import { oracle } from './oracle.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const mode=process.argv.includes('--oracle')?'oracle':'codex';
const seed=JSON.parse(await readFile(join(root,'cases/maintenance-notice/seed.json'),'utf8'));
const runId=`${new Date().toISOString().replaceAll(':','-')}-${mode}`;
const output=join(root,'runs',runId);
const workspace=await mkdtemp(join(tmpdir(),'feishu-case-'));
await mkdir(output,{recursive:true});
const hashedFiles=['src/run.mjs','src/mock.mjs','src/verify.mjs','cli/main.go','cases/maintenance-notice/seed.json','cases/maintenance-notice/instruction.md','cases/maintenance-notice/tools.md'];
const hashes=Object.fromEntries(await Promise.all(hashedFiles.map(async p=>[p,createHash('sha256').update(await readFile(join(root,p))).digest('hex')])));
await writeFile(join(output,'manifest.json'),JSON.stringify({sdkVersion:'0.154.0',cliCommit:'0493db0cd1a10d6dd8a2295128bec3e319c7fbb0',model:process.env.EVAL_MODEL||'Codex configured default',sandbox:'workspace-write',hashes},null,2));
await symlink(join(root,'bin/lark-cli'),join(workspace,'lark-cli'));
const prompt=await readFile(join(root,'cases/maintenance-notice/instruction.md'),'utf8');
await writeFile(join(workspace,'AGENTS.md'),await readFile(join(root,'cases/maintenance-notice/tools.md')));
const mock=await startMock(seed);
// Do not pass Raft/service credentials or unrelated ambient API keys to the agent.
const env=Object.fromEntries(['HOME','PATH','LANG','LC_ALL','CODEX_HOME','SSL_CERT_FILE','SSL_CERT_DIR','HTTP_PROXY','HTTPS_PROXY','ALL_PROXY','NO_PROXY','http_proxy','https_proxy','all_proxy','no_proxy'].filter(k=>process.env[k]).map(k=>[k,process.env[k]]));
env.FEISHU_MOCK_URL=mock.url;
let failure=null,usage=null,threadId=null,commands=0,completed=mode==='oracle';
const started=Date.now();
try {
  if(mode==='oracle') {
    await oracle(async args=>{
      const result=await promisify(execFile)(join(workspace,'lark-cli'),args,{env,cwd:workspace,timeout:30000,maxBuffer:4*1024*1024});
      commands++;await appendFile(join(output,'commands.jsonl'),JSON.stringify({args,...result})+'\n');
      return result;
    });
  } else {
    const codex=new Codex({env,...(process.env.CODEX_EXECUTABLE?{codexPathOverride:process.env.CODEX_EXECUTABLE}:{}),config:{features:{multi_agent:false},shell_environment_policy:{inherit:'all'}}});
    const thread=codex.startThread({workingDirectory:workspace,skipGitRepoCheck:true,sandboxMode:'workspace-write',approvalPolicy:'never',networkAccessEnabled:true,webSearchMode:'disabled',...(process.env.EVAL_MODEL?{model:process.env.EVAL_MODEL}:{})});
    const {events}=await thread.runStreamed(prompt,{signal:AbortSignal.timeout(Number(process.env.EVAL_TIMEOUT_MS||600000))});
    for await(const event of events) {
      await appendFile(join(output,'trajectory.jsonl'),JSON.stringify(event)+'\n');
      if(event.type==='thread.started') threadId=event.thread_id;
      if(event.type==='turn.completed'){usage=event.usage;failure=null;completed=true;}
      if(event.type==='turn.failed')failure=event.error.message;
      // Transport reconnect events may recover; only terminal turn failure is fatal.
      if(event.type==='item.completed' && event.item.type==='command_execution') {commands++;console.log(`command ${commands}: exit ${event.item.exit_code}`);}
      if(event.type==='item.completed' && event.item.type==='agent_message')await writeFile(join(output,'answer.md'),event.item.text);
    }
  }
} catch(e) {failure=String(e.message);}
finally {
  await mock.close();
  const result={...verify(seed,mock.world,mock.calls),mode,runId,threadId,usage,commands,durationMs:Date.now()-started,failure,workspace};
  if(!completed && !failure)failure='Codex stream ended without turn.completed';
  result.failure=failure;
  if(failure){result.status='execution_error';result.success=false;}
  await writeFile(join(output,'final-state.json'),JSON.stringify(mock.world,null,2));
  await writeFile(join(output,'api.jsonl'),mock.calls.map(c=>JSON.stringify(c)).join('\n')+'\n');
  await writeFile(join(output,'result.json'),JSON.stringify(result,null,2));
  console.log(JSON.stringify(result,null,2));console.log(`Artifacts: ${output}`);
  if(!result.success)process.exitCode=1;
}
