import type { ApiObject, World, Sheet } from '../../types.ts';
import { ApiError, fail, requireValue } from '../errors.ts';
import { parseCsv, formatCsv } from '../csv.ts';
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
          csv: formatCsv(output.ranges[0].values),
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
    if (body.tool_name === 'batch_update') {
      // Only the all-success cell-write subset is established by both upstream
      // contracts. Failed/mixed batches remain coverage gaps: never guess which
      // earlier writes survive a backend failure.
      const unsupported = () =>
        fail(
          501,
          990001,
          'ENV_UNSUPPORTED: batch requires successful cell-only operations',
        );
      if (
        Object.keys(input).some(
          (key) =>
            !['excel_id', 'operations', 'continue_on_error'].includes(key),
        ) ||
        (input.excel_id !== undefined && input.excel_id !== spreadsheetToken) ||
        (input.continue_on_error !== undefined &&
          typeof input.continue_on_error !== 'boolean') ||
        !Array.isArray(input.operations) ||
        !input.operations.length ||
        input.operations.length > 1000
      )
        unsupported();
      const staged = structuredClone(world);
      for (const operation of input.operations) {
        if (
          !operation ||
          operation.tool_name !== 'set_cell_range' ||
          Object.keys(operation).some(
            (key) => !['tool_name', 'input'].includes(key),
          ) ||
          !operation.input ||
          typeof operation.input !== 'object' ||
          Array.isArray(operation.input) ||
          (operation.input.excel_id !== undefined &&
            operation.input.excel_id !== spreadsheetToken)
        )
          unsupported();
        try {
          sheetsRoutes(staged, {
            method,
            path: p,
            query: q,
            body: {
              tool_name: 'set_cell_range',
              input: JSON.stringify(operation.input),
            },
          });
        } catch (error) {
          if (
            error instanceof ApiError &&
            [400, 404, 501].includes(error.status)
          )
            unsupported();
          throw error;
        }
      }
      world.sheets = staged.sheets;
      world.spreadsheets = staged.spreadsheets;
      return {
        output: JSON.stringify({
          total: input.operations.length,
          succeeded: input.operations.length,
          failed: 0,
          results: input.operations.map(
            (operation: ApiObject, index: number) => ({
              index,
              tool_name: operation.tool_name,
              success: true,
            }),
          ),
        }),
      };
    }
    const csvWrite = body.tool_name === 'set_range_from_csv';
    if (body.tool_name !== 'set_cell_range' && !csvWrite)
      fail(501, 990001, `ENV_UNSUPPORTED: sheet tool ${body.tool_name}`);
    if (
      Object.keys(input).some(
        (key) =>
          ![
            'excel_id',
            'sheet_id',
            'sheet_name',
            ...(csvWrite ? ['start_cell', 'csv'] : ['range', 'cells']),
            'allow_overwrite',
          ].includes(key),
      )
    )
      fail(501, 990001, 'ENV_UNSUPPORTED: sheet write options');
    if (csvWrite) {
      const start = /^([A-Z]+)([1-9][0-9]*)$/.exec(input.start_cell || '');
      requireValue(start, 'Finite start_cell required');
      const rows = parseCsv(input.csv);
      if (rows.some((row) => row.some((value) => value.startsWith('='))))
        fail(501, 990001, 'ENV_UNSUPPORTED: CSV formula evaluation');
      const firstColumn = [...start[1]].reduce(
        (n, c) => n * 26 + c.charCodeAt(0) - 64,
        0,
      );
      let lastColumn = firstColumn + rows[0].length - 1,
        letters = '';
      requireValue(
        lastColumn <= 1000 && Number(start[2]) + rows.length - 1 <= 100000,
        'Invalid write range',
      );
      while (lastColumn > 0) {
        lastColumn--;
        letters = String.fromCharCode(65 + (lastColumn % 26)) + letters;
        lastColumn = Math.floor(lastColumn / 26);
      }
      input.range = `${input.start_cell}:${letters}${Number(start[2]) + rows.length - 1}`;
      input.cells = rows.map((row) => row.map((value) => ({ value })));
    }
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
    requireValue(
      input.allow_overwrite === undefined ||
        typeof input.allow_overwrite === 'boolean',
      'allow_overwrite must be boolean',
    );
    if (input.allow_overwrite === false)
      for (let y = top; y <= bottom; y++)
        for (let x = left; x <= right; x++)
          requireValue(
            sheet.values[y]?.[x] === undefined || sheet.values[y][x] === '',
            'Write would overwrite a nonempty cell',
          );
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
