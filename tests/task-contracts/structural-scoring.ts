import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { TaskFixture } from '../helpers/task-fixture.ts';

export async function checkStructuralScoring(fixture: TaskFixture) {
  const { grade, dir, backend, seed, expected, initialGrade } = fixture;
  const solved = structuredClone(backend.world);
  if (expected.deletes?.length) {
    const id = expected.deletes[0];
    backend.world.base.records.push(
      structuredClone(
        seed.base.records.find(
          (r: { record_id: string }) => r.record_id === id,
        ),
      ),
    );
    assert.equal(await grade(), '0', 'Leaving an erased account must fail');
    Object.assign(backend.world, structuredClone(solved));
  }
  if (expected.order_groups?.length) {
    const originalSeq = backend.calls.map((call) => call.seq);
    backend.calls.forEach((call, index) => {
      call.seq = backend.calls.length - index;
    });
    assert.equal(
      await grade(),
      '0',
      'correct final state with reversed SOP stages must fail',
    );
    backend.calls.forEach((call, index) => {
      call.seq = originalSeq[index];
    });
    assert.equal(await grade(), '1');
  }
  const flexible = expected.cells?.find(
    (c: { one_of?: unknown[] }) => c.one_of && c.one_of.length > 1,
  );
  if (flexible) {
    const sheet =
      backend.world.spreadsheets![flexible.spreadsheet_token].sheets[
        flexible.sheet_id
      ];
    sheet.values[flexible.row][flexible.column] = flexible.one_of.find(
      (v: unknown) => v !== flexible.value,
    );
    assert.equal(
      await grade(),
      '1',
      'Another permitted business recommendation must pass',
    );
    sheet.values[flexible.row][flexible.column] = 'unsupported recommendation';
    assert.equal(await grade(), '0', 'An unsupported recommendation must fail');
    Object.assign(backend.world, structuredClone(solved));
  }

  for (const vcEvent of (expected.events || []).filter(
    (e: { vc_data?: unknown }) => e.vc_data,
  )) {
    const event = backend.world.events.find(
      (e: { summary: string }) => e.summary === vcEvent.summary,
    );
    assert.ok(event);
    delete event.vc_data;
    assert.equal(
      await grade(),
      '0',
      'A scheduled event missing its required video settings must fail',
    );
    Object.assign(backend.world, structuredClone(solved));
  }

  for (const createdChat of expected.new_chats || []) {
    const chat = backend.world.chats.find(
      (c: { name: string }) => c.name === createdChat.name,
    );
    assert.ok(chat);
    chat.member_ids = createdChat.user_ids.length ? [] : ['unexpected_member'];
    assert.equal(
      await grade(),
      '0',
      'Created room membership must match the required members',
    );
    Object.assign(backend.world, structuredClone(solved));
  }

  for (const membership of expected.memberships || []) {
    const chat = backend.world.chats.find(
      (c: { chat_id: string }) => c.chat_id === membership.chat_id,
    );
    assert.ok(chat);
    chat.member_ids = chat.member_ids.filter(
      (id: string) => id !== membership.user_ids[0],
    );
    assert.equal(
      await grade(),
      '0',
      'A welcome message without required membership must fail',
    );
    Object.assign(backend.world, structuredClone(solved));
  }

  const beforeIds = new Set(
    seed.base.records.map((r: { record_id: string }) => r.record_id),
  );
  const created = backend.world.base.records.find(
    (r: { record_id: string }) => !beforeIds.has(r.record_id),
  );
  const newMessage = backend.world.messages.find(
    (m: { message_id: string }) =>
      !seed.messages.some(
        (old: { message_id: string }) => old.message_id === m.message_id,
      ),
  );
  const newMail = backend.world.mail?.messages.find(
    (m) =>
      m.message_state === 2 &&
      !(seed.mail?.messages || []).some(
        (old: { message_id: string }) => old.message_id === m.message_id,
      ),
  );
  const newDraft = backend.world.mail?.drafts.find(
    (d) =>
      !(seed.mail?.drafts || []).some((old: { id: string }) => old.id === d.id),
  );
  const newDocument = backend.world.docs?.documents.find(
    (d) =>
      !seed.docs?.documents.some(
        (old: { document_id: string }) => old.document_id === d.document_id,
      ),
  );
  const newFolder = backend.world.docs?.folders.find(
    (f) =>
      !seed.docs?.folders.some(
        (old: { token: string }) => old.token === f.token,
      ),
  );
  const newEvent = backend.world.events.find(
    (e: { event_id: string }) =>
      !seed.events.some(
        (old: { event_id: string }) => old.event_id === e.event_id,
      ),
  );
  if (created)
    backend.world.base.records = backend.world.base.records.filter(
      (r: { record_id: string }) => r.record_id !== created.record_id,
    );
  else if (newMessage)
    // A missing recipient is structural even when complete report
    // content can legitimately span or combine messages.
    backend.world.messages = backend.world.messages.filter(
      (m: { message_id: string; chat_id: string }) =>
        m.chat_id !== newMessage.chat_id ||
        seed.messages.some(
          (old: { message_id: string }) => old.message_id === m.message_id,
        ),
    );
  else if (newMail)
    backend.world.mail!.messages = backend.world.mail!.messages.filter(
      (m) => m.message_id !== newMail.message_id,
    );
  else if (newDraft) {
    backend.world.mail!.drafts = backend.world.mail!.drafts.filter(
      (d) => d.id !== newDraft.id,
    );
    backend.world.mail!.messages = backend.world.mail!.messages.filter(
      (m) => m.message_id !== newDraft.message_id,
    );
  } else if (newEvent)
    backend.world.events = backend.world.events.filter(
      (e: { event_id: string }) => e.event_id !== newEvent.event_id,
    );
  else if (newDocument)
    backend.world.docs!.documents = backend.world.docs!.documents.filter(
      (d) => d.document_id !== newDocument.document_id,
    );
  else if (newFolder)
    backend.world.docs!.folders = backend.world.docs!.folders.filter(
      (f) => f.token !== newFolder.token,
    );
  else {
    if (seed.drive_files)
      backend.world.drive_files = structuredClone(seed.drive_files);
    backend.world.base = structuredClone(seed.base);
    backend.world.sheets = structuredClone(seed.sheets);
    if (seed.spreadsheets)
      backend.world.spreadsheets = structuredClone(seed.spreadsheets);
  }
  const incompleteGrade = await grade();
  if (incompleteGrade === '1') {
    assert.equal(
      initialGrade,
      '1',
      'A missing structural action must still fail in code',
    );
    const incomplete = JSON.parse(
      await readFile(join(dir, 'result.json'), 'utf8'),
    );
    assert.equal(
      incomplete.semantic?.required,
      true,
      'Missing text-only work must still reach the semantic judge',
    );
  } else assert.equal(incompleteGrade, '0');
  Object.assign(backend.world, solved);
  backend.world.now = '1900-01-01T00:00:00Z';
  assert.equal(await grade(), '0');
}
