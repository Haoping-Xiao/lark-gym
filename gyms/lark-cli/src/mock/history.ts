import { isDeepStrictEqual } from 'node:util';
import type { ApiCall, ApiObject, World } from '../types.ts';

export function collectMutations(
  before: World,
  world: World,
): ApiCall['mutations'] {
  const mutations: ApiCall['mutations'] = [];
  for (const [kind, oldItems, newItems, key] of [
    [
      'mail_message',
      before.mail?.messages || [],
      world.mail?.messages || [],
      'message_id',
    ],
    ['mail_draft', before.mail?.drafts || [], world.mail?.drafts || [], 'id'],
    ['event', before.events, world.events, 'event_id'],
    ['record', before.base.records, world.base.records, 'record_id'],
    ['message', before.messages, world.messages, 'message_id'],
    ['chat', before.chats, world.chats, 'chat_id'],
  ] as [string, ApiObject[], ApiObject[], string][]) {
    for (const item of oldItems) {
      if (!newItems.some((x) => x[key] === item[key]))
        mutations.push({
          kind,
          id: item[key],
          before: structuredClone(item),
          after: null,
        });
    }
    for (const item of newItems) {
      const previous = oldItems.find((x) => x[key] === item[key]);
      if (!isDeepStrictEqual(previous, item))
        mutations.push({
          kind,
          id: item[key],
          before: structuredClone(previous),
          after: structuredClone(item),
        });
    }
  }
  for (const id of new Set([
    ...Object.keys(before.sheets),
    ...Object.keys(world.sheets),
  ])) {
    if (!isDeepStrictEqual(before.sheets[id], world.sheets[id]))
      mutations.push({
        kind: 'sheet',
        id,
        before: structuredClone(before.sheets[id]),
        after: structuredClone(world.sheets[id]),
      });
  }
  for (const token of new Set([
    ...Object.keys(before.spreadsheets || {}),
    ...Object.keys(world.spreadsheets || {}),
  ])) {
    const oldBook = before.spreadsheets?.[token],
      newBook = world.spreadsheets?.[token];
    if (!isDeepStrictEqual(oldBook, newBook))
      mutations.push({
        kind: 'spreadsheet',
        id: token,
        before: structuredClone(oldBook),
        after: structuredClone(newBook),
      });
  }
  return mutations;
}
