import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
test('mail generation preserves read state and assigns a local thread only when absent', async () => {
  const dir = await fs.mkdtemp(path.join(tmpdir(), 'mail-generation-'));
  try {
    await fs.cp('scripts/migration', path.join(dir, 'scripts/migration'), {
      recursive: true,
    });
    const source = JSON.parse(
      await fs.readFile('tests/fixtures/source-mail-3102.json', 'utf8'),
    );
    await fs.writeFile(path.join(dir, 'source.json'), JSON.stringify([source]));
    execFileSync('python', [
      path.join(dir, 'scripts/migration/simple-crm.py'),
      path.join(dir, 'source.json'),
    ]);
    const generated = JSON.parse(
      await fs.readFile(
        path.join(
          dir,
          'tasks/automationbench-simple-3102/environment/seed.json',
        ),
        'utf8',
      ),
    );
    assert.deepEqual(generated.mail.messages[0].label_ids, []);
    assert.equal(generated.mail.messages[0].thread_id, 'thread_msg_4201');
    assert.equal(generated.mail.mailboxes[0].email_type, 'USER_PRIMARY');
    assert.equal(
      Buffer.from(
        generated.mail.messages[0].body_plain_text,
        'base64url',
      ).toString(),
      source.info.initial_state.gmail.messages[0].body_plain,
    );
    source.info.initial_state.gmail.messages[0].thread_id = 'original-thread';
    source.info.initial_state.gmail.messages[0].label_ids.push('UNREAD');
    await fs.writeFile(path.join(dir, 'source.json'), JSON.stringify([source]));
    execFileSync('python', [
      path.join(dir, 'scripts/migration/simple-crm.py'),
      path.join(dir, 'source.json'),
    ]);
    const repeated = JSON.parse(
      await fs.readFile(
        path.join(
          dir,
          'tasks/automationbench-simple-3102/environment/seed.json',
        ),
        'utf8',
      ),
    );
    assert.equal(repeated.mail.messages[0].thread_id, 'original-thread');
    assert.deepEqual(repeated.mail.messages[0].label_ids, ['UNREAD']);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});
