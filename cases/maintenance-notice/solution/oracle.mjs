// Reference solution using normal CLI commands only; never exposed to solver.
export async function oracle(cli) {
  await cli([
    'sheets',
    '+workbook-info',
    '--spreadsheet-token',
    'ss_maint_plan',
  ]);
  for (const [sheet, range] of [
    ['ws_maint_policy', 'A1:B4'],
    ['ws_plan', 'A1:E7'],
  ])
    await cli([
      'sheets',
      '+cells-get',
      '--spreadsheet-token',
      'ss_maint_plan',
      '--sheet-id',
      sheet,
      '--range',
      range,
    ]);
  await cli([
    'calendar',
    'events',
    'create',
    '--calendar-id',
    'cal_ops',
    '--data',
    JSON.stringify({
      summary: 'Data Closet power shutdown',
      start_time: {
        timestamp: String(Date.parse('2026-02-22T02:00:00Z') / 1000),
      },
      end_time: {
        timestamp: String(Date.parse('2026-02-22T04:00:00Z') / 1000),
      },
    }),
  ]);
  const text = 'Data Closet: 2026-02-22T02:00:00Z – 2026-02-22T04:00:00Z';
  await cli([
    'base',
    '+record-upsert',
    '--base-token',
    'base_ops',
    '--table-id',
    'tbl_maintenance',
    '--record-id',
    'rec_200',
    '--json',
    JSON.stringify({ 'Maintenance log': text }),
  ]);
  await cli(['im', '+messages-send', '--chat-id', 'oc_it_ops', '--text', text]);
  await cli([
    'calendar',
    'events',
    'get',
    '--calendar-id',
    'cal_ops',
    '--event-id',
    'evt_1',
  ]);
}
