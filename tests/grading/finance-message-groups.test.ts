import test from 'node:test';
import assert from 'node:assert/strict';
import {
  verifyMailVariant,
  isMail,
  notice,
} from '../helpers/native-mail-variants.ts';
for (const id of [4059, 4060])
  test(`finance ${id}: source message groups allow combined or split reports`, async () => {
    for (const mode of [
      'combined',
      'split',
      'separated-pair',
      'missing',
      'wrong-recipient',
      'forbidden',
    ]) {
      const result = await verifyMailVariant(
        `automationbench-finance-${id}`,
        (commands) =>
          commands.flatMap((c) => {
            if (!isMail(c) || mode === 'combined') return [c];
            let texts =
              id === 4059
                ? [
                    'Defunct Co | INV-6001 | $8,400',
                    'NoReply Corp | INV-6005 | $4,100',
                    'Total write-off | $12,500',
                  ]
                : [
                    'Jane Smith Consulting | $28,500 | Ready',
                    "Mike's Design Shop | $12,200 | Missing W-9",
                    'Rivera Photography | $4,800 | Ready',
                  ];
            if (mode === 'separated-pair') {
              const parts = texts.shift()!.split(' | ');
              texts.unshift(parts[0], parts.slice(1).join(' | '));
            }
            if (mode === 'missing')
              texts = texts.filter(
                (t) => !t.includes(id === 4059 ? 'NoReply' : 'Rivera'),
              );
            const out = texts.map((t) =>
              notice(
                c,
                t,
                mode === 'wrong-recipient'
                  ? 'wrong@company.example.com'
                  : undefined,
              ),
            );
            if (mode === 'forbidden')
              out.push(
                notice(
                  c,
                  'TechCorp 已排除。',
                  id === 4059 ? 'bob@company.example.com' : undefined,
                ),
              );
            return out;
          }),
      );
      assert.equal(
        result.business_success,
        ['combined', 'split'].includes(mode),
        mode,
      );
    }
  });
