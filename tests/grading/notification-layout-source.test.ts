import test from 'node:test';
import assert from 'node:assert/strict';
import {
  verifyMailVariant,
  isMail,
  recipient,
  notice,
} from '../helpers/native-mail-variants.ts';
for (const [id, to, required] of [
  [4074, 'controller@company.example.com', '47,500'],
  [4078, 'cfo@company.example.com', 'Marketing'],
  [4085, 'ar@alpinegroup.example.com', '7,875'],
  [5078, 'david.okonkwo@company.example.com', 'Sarah Nakamura'],
  [5131, 'hr-director@company.example.com', 'Hugo Fernandez'],
] as const)
  test(`notification ${id}: layout freedom retains source body and recipient constraints`, async () => {
    for (const mode of ['layout', 'missing', 'wrong-recipient']) {
      const result = await verifyMailVariant(
        `automationbench-${id >= 5000 ? 'hr' : 'finance'}-${id}`,
        (commands) => {
          const original = commands.filter(
              (c) => isMail(c) && recipient(c) === to,
            ),
            prototype = original[0];
          let texts = original.map((c) => c[c.indexOf('--body') + 1]);
          if (id === 5131) texts = [texts.join('\n')];
          else if (id === 4074 || id === 4078)
            texts = texts.flatMap((t) => t.split('\n'));
          else if (id === 4085)
            texts = [
              'Alpine Solutions Group | QU-104 | Invoice total $7,875',
              'Alpine Solutions Group | QU-104 | Due 2026-03-12',
            ];
          else
            texts = [
              'David Okonkwo | Taking over Platform team (currently under VP Eng)',
              'New Direct Reports: Alice Park, Sarah Nakamura, Alicia Fernandez',
            ];
          if (mode === 'missing')
            texts = texts.map((t) => t.replaceAll(required, ''));
          return [
            ...commands.filter((c) => !original.includes(c)),
            ...texts.map((t) =>
              notice(
                prototype,
                t,
                mode === 'wrong-recipient' ? 'wrong@company.example.com' : to,
              ),
            ),
          ];
        },
      );
      assert.equal(result.business_success, mode === 'layout', mode);
    }
  });
