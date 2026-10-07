import test, { describe } from 'node:test';
import { createTaskFixture, taskNames } from '../helpers/task-fixture.ts';
import { checkNoOp } from './no-op.ts';
import { checkReferenceSolution } from './reference-solution.ts';
import { checkSemanticHandoff } from './semantic-handoff.ts';
import { checkStructuralScoring } from './structural-scoring.ts';

// Orchestration only: the four files above each own one validation purpose.
// Keep one reference execution per task; splitting into independent runs doubles that work.
describe(
  'Task acceptance: solvability and scoring contracts',
  { concurrency: 4 },
  () => {
    for (const task of taskNames) {
      test(task, { timeout: 30000 }, async (t) => {
        const fixture = await createTaskFixture(task);
        try {
          await t.test(
            'No-op fails or explicitly requires semantic review',
            () => checkNoOp(fixture),
          );
          let solved = false;
          await t.test(
            'Reference solution executes and passes programmatic checks',
            async () => {
              await checkReferenceSolution(fixture);
              solved = true;
            },
          );
          if (!solved) return; // No valid solved fixture exists for the mutation checks.
          const world = structuredClone(fixture.backend.world);
          const calls = structuredClone(fixture.backend.calls);
          const reset = () => {
            Object.assign(fixture.backend.world, structuredClone(world));
            fixture.backend.calls.splice(
              0,
              fixture.backend.calls.length,
              ...structuredClone(calls),
            );
          };
          await t.test('Text meaning reaches the semantic judge', () =>
            checkSemanticHandoff(fixture),
          );
          reset();
          await t.test(
            'Structural mistakes fail and permitted alternatives pass',
            () => checkStructuralScoring(fixture),
          );
        } finally {
          await fixture.close();
        }
      });
    }
  },
);
