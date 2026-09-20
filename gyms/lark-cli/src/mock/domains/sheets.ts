import type { ApiObject, World, Sheet } from '../../types.ts';
import { fail, requireValue } from '../errors.ts';
import type { ApiRequest, ResponseData } from '../types.ts';

function values(range: string, sheets: Record<string, Sheet>) {
  const [id, cells] = range.split('!'),
    sheet = sheets[id];
  if (!sheet) fail(404, 1310002, 'Sheet not found');
  if (!cells) return { range, values: structuredClone(sheet.values) };
  const match = /^([A-Z]+)(\d+)?(?::([A-Z]+)(\d+)?)?$/.exec(cells);
  requireValue(match, 'Unsupported A1 range');
  const col = (x: string) =>
    [...x].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1;
  const left = col(match[1]),
    right = col(match[3] || match[1]);
  const top = Number(match[2] || 1) - 1,
    bottom = Number(
      match[4] ||
        (match[3] ? sheet.values.length : match[2] || sheet.values.length),
    );
  requireValue(right >= left && bottom > top, 'Invalid A1 range');
  return {
    range,
    values: structuredClone(
      sheet.values.slice(top, bottom).map((row) => row.slice(left, right + 1)),
    ),
  };
}

export function sheetsRoutes(
  world: Pick<
    World,
    'sheets' | 'spreadsheets' | 'spreadsheet_token' | 'spreadsheet_title'
  >,
  { method, path: p, query: q, body }: ApiRequest,
): ResponseData | undefined {
  const spreadsheetId =
    /^\/open-apis\/(?:sheets|sheet_ai)\/v[23]\/spreadsheets\/([^/]+)/.exec(
      p,
    )?.[1];
  const book = world.spreadsheets?.[spreadsheetId || ''];
  const sheets = book?.sheets ?? world.sheets;
  const spreadsheetToken = book ? spreadsheetId : world.spreadsheet_token;
  const spreadsheetTitle = book?.title ?? world.spreadsheet_title;
  if (
    method === 'GET' &&
    p === `/open-apis/sheets/v3/spreadsheets/${spreadsheetToken}`
  )
    return {
      spreadsheet: {
        spreadsheet_token: spreadsheetToken,
        title: spreadsheetTitle || 'Maintenance Plan',
      },
    };
  if (
    method === 'GET' &&
    p === `/open-apis/sheets/v3/spreadsheets/${spreadsheetToken}/sheets/query`
  )
    return {
      sheets: Object.entries(sheets).map(([sheet_id, s], index) => ({
        sheet_id,
        title: s.title,
        index,
        grid_properties: {
          row_count: s.values.length,
          column_count: s.values[0].length,
        },
      })),
    };
  if (
    method === 'POST' &&
    p ===
      `/open-apis/sheet_ai/v2/spreadsheets/${spreadsheetToken}/tools/invoke_read`
  ) {
    let input: ApiObject;
    try {
      input = JSON.parse(body.input);
    } catch {
      fail(400, 99992402, 'Invalid tool input');
    }
    let output: ApiObject;
    if (body.tool_name === 'get_workbook_structure')
      output = {
        revision: 1,
        sheets: Object.entries(sheets).map(([sheet_id, s], index) => ({
          sheet_id,
          title: s.title,
          name: s.title,
          index,
          row_count: s.values.length,
          column_count: s.values[0].length,
          hidden: false,
        })),
      };
    else if (
      body.tool_name === 'get_cell_ranges' ||
      body.tool_name === 'get_range_as_csv'
    ) {
      const sid =
        input.sheet_id ||
        Object.keys(sheets).find((id) => sheets[id].title === input.sheet_name);
      requireValue(sid && sheets[sid], 'Unknown sheet');
      const ranges = input.ranges || [input.range];
      requireValue(
        Array.isArray(ranges) &&
          ranges.every((x: unknown) => typeof x === 'string'),
        'ranges required',
      );
      output = {
        sheet_id: sid,
        ranges: ranges.map((range: string) => {
          const v = values(`${sid}!${range}`, sheets);
          return {
            range,
            values: v.values,
            cells: v.values.map((row) => row.map((value) => ({ value }))),
            has_more: false,
          };
        }),
        has_more: false,
      };
      if (body.tool_name === 'get_range_as_csv')
        output = {
          csv: output.ranges[0].values
            .map((row: unknown[]) =>
              row.map((v) => JSON.stringify(v)).join(','),
            )
            .join('\n'),
          has_more: false,
        };
    } else fail(501, 990001, `ENV_UNSUPPORTED: sheet tool ${body.tool_name}`);
    return { output: JSON.stringify(output) };
  }
  if (
    method === 'POST' &&
    p ===
      `/open-apis/sheet_ai/v2/spreadsheets/${spreadsheetToken}/tools/invoke_write`
  ) {
    let input: ApiObject;
    try {
      input = JSON.parse(body.input);
    } catch {
      fail(400, 99992402, 'Invalid tool input');
    }
    if (body.tool_name !== 'set_cell_range')
      fail(501, 990001, `ENV_UNSUPPORTED: sheet tool ${body.tool_name}`);
    if (
      Object.keys(input).some(
        (key) =>
          !['excel_id', 'sheet_id', 'sheet_name', 'range', 'cells'].includes(
            key,
          ),
      )
    )
      fail(501, 990001, 'ENV_UNSUPPORTED: sheet write options');
    const sid =
      input.sheet_id ||
      Object.keys(sheets).find((id) => sheets[id].title === input.sheet_name);
    const sheet = sheets[sid];
    requireValue(sheet, 'Unknown sheet');
    const match = /^([A-Z]+)([1-9][0-9]*)(?::([A-Z]+)([1-9][0-9]*))?$/.exec(
      input.range || '',
    );
    requireValue(match, 'Finite A1 range required');
    const col = (letters: string) =>
      [...letters].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1;
    const left = col(match[1]),
      top = Number(match[2]) - 1;
    const right = col(match[3] || match[1]),
      bottom = Number(match[4] || match[2]) - 1;
    requireValue(
      left <= right && top <= bottom && bottom < 100000 && right < 1000,
      'Invalid write range',
    );
    requireValue(
      Array.isArray(input.cells) &&
        input.cells.length === bottom - top + 1 &&
        input.cells.every(
          (row: unknown) =>
            Array.isArray(row) && row.length === right - left + 1,
        ),
      'Cell matrix must match range',
    );
    for (const row of input.cells)
      for (const cell of row) {
        if (!cell || Object.keys(cell).some((key) => key !== 'value'))
          fail(501, 990001, 'ENV_UNSUPPORTED: only cell values are supported');
        requireValue(
          ['string', 'number', 'boolean'].includes(typeof cell.value),
          'Invalid cell value',
        );
      }
    for (let y = top; y <= bottom; y++) {
      while (sheet.values.length <= y) sheet.values.push([]);
      for (let x = left; x <= right; x++) {
        while (sheet.values[y].length <= x) sheet.values[y].push('');
        sheet.values[y][x] = input.cells[y - top][x - left].value;
      }
    }
    return {
      output: JSON.stringify({
        sheet_id: sid,
        range: input.range,
        updated_cells: input.cells.length * input.cells[0].length,
      }),
    };
  }
  const valPrefix = `/open-apis/sheets/v2/spreadsheets/${spreadsheetToken}/`;
  if (method === 'GET' && p.startsWith(valPrefix + 'values/'))
    return {
      spreadsheetToken: spreadsheetToken,
      revision: 1,
      valueRange: values(p.slice((valPrefix + 'values/').length), sheets),
    };
  if (method === 'GET' && p === valPrefix + 'values_batch_get') {
    const ranges = q.getAll('ranges').flatMap((x) => x.split(','));
    requireValue(ranges.length, 'ranges required');
    return {
      spreadsheetToken: spreadsheetToken,
      revision: 1,
      valueRanges: ranges.map((range) => values(range, sheets)),
    };
  }
}
