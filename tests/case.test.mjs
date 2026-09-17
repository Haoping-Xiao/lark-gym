import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {startMock} from '../src/mock.mjs';
import {verify} from '../src/verify.mjs';
import {oracle} from '../src/oracle.mjs';
const seed=JSON.parse(await readFile(new URL('../cases/maintenance-notice/seed.json',import.meta.url)));
const binary=new URL('../bin/lark-cli',import.meta.url).pathname;
const event={summary:'Data Closet',start_time:{timestamp:String(Date.parse('2026-02-22T02:00:00Z')/1000)},end_time:{timestamp:String(Date.parse('2026-02-22T04:00:00Z')/1000)}};
const path='/open-apis/calendar/v4/calendars/cal_ops/events';
async function api(mock,method,path,body) {
 const r=await fetch(mock.url+path,{method,headers:{authorization:'Bearer local-evaluation-only','content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
 return {status:r.status,...await r.json()};
}
async function cli(mock,args) {
 return promisify(execFile)(binary,args,{env:{PATH:process.env.PATH,HOME:process.env.HOME,FEISHU_MOCK_URL:mock.url},timeout:30000});
}
test('real CLI reference trajectory passes and a fresh run cannot inherit state',async()=>{
 const a=await startMock(seed),b=await startMock(seed);
 try {
  await oracle(args=>cli(a,args));
  assert.equal(verify(seed,a.world,a.calls).status,'pass');
  assert.equal(verify(seed,b.world,b.calls).status,'fail');
  assert.deepEqual(b.world,seed);
  assert.ok(a.calls.some(c=>c.path===path && c.method==='POST'));
 }finally{await a.close();await b.close();}
});
test('shared state survives alternate typed/raw query paths and supports pagination',async()=>{
 const m=await startMock(seed);
 try {
  await cli(m,['calendar','events','create','--calendar-id','cal_ops','--data',JSON.stringify(event)]);
  const first=await api(m,'GET',path+'?page_size=1');assert.equal(first.data.items.length,1);assert.equal(first.data.has_more,true);
  const second=await api(m,'GET',path+'?page_size=1&page_token='+first.data.page_token);assert.equal(second.data.items[0].summary,'Data Closet');
  const id=second.data.items[0].event_id;
  await cli(m,['api','PATCH',`${path}/${id}`,'--data','{"summary":"Updated"}']);
  const {stdout}=await cli(m,['calendar','events','get','--calendar-id','cal_ops','--event-id',id]);assert.match(stdout,/Updated/);
  await api(m,'DELETE',`${path}/${id}`);
  assert.equal((await api(m,'GET',path)).data.items.length,1);
  assert.equal((await api(m,'GET',`${path}/${id}`)).data.event.status,'cancelled');
 }finally{await m.close();}
});
test('denied and invalid writes are atomic; unknown endpoints are coverage gaps',async()=>{
 const m=await startMock(seed);
 try {
  assert.equal((await api(m,'POST',path.replace('cal_ops','cal_readonly'),event)).status,403);
  assert.equal((await api(m,'POST',path,{...event,end_time:{timestamp:'0'}})).status,400);
  assert.deepEqual(m.world,seed);
  assert.equal((await api(m,'GET','/open-apis/not-implemented')).status,501);
  assert.equal(verify(seed,m.world,m.calls).status,'environment_incomplete');
 }finally{await m.close();}
});
test('verifier rejects wrong-window creation even if subsequently cancelled',async()=>{
 const m=await startMock(seed);
 try {
  await oracle(args=>cli(m,args));
  const wrong=await api(m,'POST',path,{...event,start_time:{timestamp:String(Date.parse('2026-02-20T02:00:00Z')/1000)},end_time:{timestamp:String(Date.parse('2026-02-20T04:00:00Z')/1000)}});
  await api(m,'DELETE',`${path}/${wrong.data.event.event_id}`);
  const v=verify(seed,m.world,m.calls);assert.equal(v.status,'fail');assert.equal(v.checks.no_forbidden_window_ever_created,false);
 }finally{await m.close();}
});
test('verifier detects corrupt notification, collateral record mutation and missing policy read',async()=>{
 const m=await startMock(seed);
 try {
  await oracle(args=>cli(m,args));
  m.world.messages[0].body.content=JSON.stringify({text:'Data Closet tomorrow'});
  m.world.base.records.find(r=>r.record_id==='rec_other').fields.System='Changed';
  const calls=m.calls.filter(c=>!c.path.includes('ws_maint_policy'));
  const v=verify(seed,m.world,calls);
  assert.equal(v.checks.exactly_one_correct_notification,false);
  assert.equal(v.checks.unrelated_records_unchanged,false);
  assert.equal(v.checks.read_all_policy_before_write,false);
 }finally{await m.close();}
});
test('CLI dry-run never changes business state; missing mock URL fails closed',async()=>{
 const m=await startMock(seed);
 try {
  await cli(m,['calendar','events','create','--calendar-id','cal_ops','--data',JSON.stringify(event),'--dry-run']);
  assert.deepEqual(m.world,seed);
  await assert.rejects(promisify(execFile)(binary,['--help'],{env:{PATH:process.env.PATH}}),/FEISHU_MOCK_URL/);
 }finally{await m.close();}
});
