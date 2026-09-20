import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRouter } from '../gyms/lark-cli/src/mock/router.ts';
import type { ApiRequest } from '../gyms/lark-cli/src/mock/types.ts';
import type { World } from '../gyms/lark-cli/src/types.ts';

const seed: World = JSON.parse(
  readFileSync('tasks/maintenance-notice/environment/seed.json', 'utf8'),
);

function restrictState(allowed: string[]) {
  return new Proxy(structuredClone(seed), {
    get(target, key, receiver) {
      assert.ok(
        allowed.includes(String(key)),
        `Unrelated state read: ${String(key)}`,
      );
      return Reflect.get(target, key, receiver);
    },
  });
}

test('Each API family reads only its own business state', () => {
  const sheets = [
    'spreadsheets',
    'sheets',
    'spreadsheet_token',
    'spreadsheet_title',
  ];
  const cases: {
    request: Partial<ApiRequest> & { path: string };
    allowed: string[];
  }[] = [
    { request: { path: '/open-apis/authen/v1/user_info' }, allowed: [] },
    {
      request: { path: '/open-apis/calendar/v4/calendars' },
      allowed: ['calendars'],
    },
    { request: { path: '/open-apis/im/v1/chats' }, allowed: ['chats'] },
    {
      request: {
        path: '/open-apis/base/v3/bases/base_ops/tables/tbl_maintenance/fields',
      },
      allowed: ['base'],
    },
    {
      request: {
        path: '/open-apis/bitable/v1/apps/base_ops/tables/tbl_maintenance/fields',
      },
      allowed: ['base'],
    },
    {
      request: { path: '/open-apis/sheets/v3/spreadsheets/ss_maint_plan' },
      allowed: sheets,
    },
    {
      request: {
        method: 'POST',
        path: '/open-apis/sheet_ai/v2/spreadsheets/ss_maint_plan/tools/invoke_read',
        body: { tool_name: 'get_workbook_structure', input: '{}' },
      },
      allowed: sheets,
    },
  ];
  for (const { request, allowed } of cases) {
    const route = createRouter(restrictState(allowed));
    assert.ok(
      route({
        method: 'GET',
        query: new URLSearchParams(),
        body: {},
        ...request,
      }),
    );
  }
});

test('Unknown API families fail as coverage gaps without inspecting business data', () => {
  const route = createRouter(restrictState([]));
  for (const path of [
    '/open-apis/unknown/v1/resource',
    '/open-apis/calendar_extra/v4/calendars',
    '/open-apis/sheets_extra/v3/spreadsheets/ss_maint_plan',
    '/other/calendar/v4/calendars',
    '/open-apis/calendar',
  ]) {
    assert.throws(
      () =>
        route({ method: 'GET', path, query: new URLSearchParams(), body: {} }),
      { status: 501, code: 990001, message: `ENV_UNSUPPORTED: GET ${path}` },
    );
  }
});
