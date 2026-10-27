import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

test('instruction audit separates source literals, additions and conclusion candidates', () => {
  const output = execFileSync(
    'python3',
    [
      '-c',
      `
import importlib.util,json
spec=importlib.util.spec_from_file_location('audit','scripts/migration/audit-instructions.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
print(json.dumps(m.candidates('Email cfo@example.com. Budget 40,000 on 2026-02-10.', '发送给 cfo@example.com，金额 40000。隐藏阈值50000。新增 audit@example.com；日期 2026-02-11。优先跳过已关闭条目。'),ensure_ascii=False))
`,
    ],
    { encoding: 'utf8' },
  );
  const findings = JSON.parse(output);
  assert(
    !findings.some((f) => f.value === 'cfo@example.com' || f.value === '40000'),
  );
  assert(
    findings.some((f) => f.kind === 'email' && f.value === 'audit@example.com'),
  );
  assert(findings.some((f) => f.kind === 'number' && f.value === '50000'));
  assert(
    !findings.some((f) => f.kind === 'number' && /2026|-02|-11/.test(f.value)),
  );
  assert(findings.some((f) => f.kind === 'date' && f.value === '2026-02-11'));
  assert(
    findings.some((f) => f.kind === 'conclusion' && f.value.includes('跳过')),
  );
});
