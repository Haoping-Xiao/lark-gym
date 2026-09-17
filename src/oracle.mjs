// Human-authored reference trajectory; not supplied to Codex.
export async function oracle(cli) {
  await cli(['api','GET','/open-apis/sheets/v3/spreadsheets/ss_maint_plan/sheets/query']);
  for(const range of ['ws_maint_policy!A1:B4','ws_plan!A1:E7']) await cli(['api','GET',`/open-apis/sheets/v2/spreadsheets/ss_maint_plan/values/${range}`]);
  await cli(['calendar','events','create','--calendar-id','cal_ops','--data',JSON.stringify({summary:'Data Closet power shutdown',start_time:{timestamp:String(Date.parse('2026-02-22T02:00:00Z')/1000)},end_time:{timestamp:String(Date.parse('2026-02-22T04:00:00Z')/1000)}})]);
  const text='Data Closet: 2026-02-22T02:00:00Z – 2026-02-22T04:00:00Z';
  await cli(['api','PUT','/open-apis/bitable/v1/apps/base_ops/tables/tbl_maintenance/records/rec_200','--data',JSON.stringify({fields:{'Maintenance log':text}})]);
  await cli(['api','POST','/open-apis/im/v1/messages','--params','{"receive_id_type":"chat_id"}','--data',JSON.stringify({receive_id:'oc_it_ops',msg_type:'text',content:JSON.stringify({text})})]);
  await cli(['api','GET','/open-apis/calendar/v4/calendars/cal_ops/events']);
}
