import { requireValue } from './errors.ts';

// Preserve text exactly; CSV import does not infer numbers, booleans or formulas.
export function parseCsv(text: string): string[][] {
  requireValue(
    typeof text === 'string' && text.length > 0,
    'Nonempty CSV required',
  );
  const rows: string[][] = [];
  let row: string[] = [],
    field = '',
    quoted = false,
    closed = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c !== '"') field += c;
      else if (text[i + 1] === '"') {
        field += '"';
        i++;
      } else {
        quoted = false;
        closed = true;
      }
      continue;
    }
    if (c === ',' || c === '\r' || c === '\n') {
      row.push(field);
      field = '';
      closed = false;
      if (c !== ',') {
        rows.push(row);
        row = [];
        if (c === '\r' && text[i + 1] === '\n') i++;
      }
    } else if (c === '"') {
      requireValue(!closed && field === '', 'Invalid CSV quote');
      quoted = true;
    } else {
      requireValue(!closed, 'Unexpected text after CSV closing quote');
      field += c;
    }
  }
  requireValue(!quoted, 'Unclosed CSV quote');
  if (row.length || field.length || closed || !/[\r\n]$/.test(text)) {
    row.push(field);
    rows.push(row);
  }
  requireValue(
    rows.length > 0 && rows.every((r) => r.length === rows[0].length),
    'CSV rows must have equal widths',
  );
  return rows;
}

export function formatCsv(rows: unknown[][]): string {
  return rows
    .map((row) =>
      row
        .map((value) => {
          const text = String(value ?? '');
          return /[",\r\n]/.test(text)
            ? `"${text.replaceAll('"', '""')}"`
            : text;
        })
        .join(','),
    )
    .join('\n');
}
