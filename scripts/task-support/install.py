"""Install task-owned environment policy hooks without replacing task graders."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
POLICY = dict(version=1, execution='abort', penalty_per_call=0, max_penalty=None, score_floor=0,
              exclude_from_valid_samples=True,
              feedback='当前模拟环境尚未实现此操作，本次操作未执行。')

def install_environment(task):
    """Install only task-owned lifecycle files; do not alter business graders."""
    for directory in ('environment', 'tests'):
        (task / directory / 'unsupported.ts').write_text(Path(__file__).with_name('unsupported.ts').read_text())
    path = task / 'environment/unsupported-policy.json'
    policy = json.loads(path.read_text()) if path.exists() else dict(POLICY)
    policy.setdefault('execution', 'abort')
    if policy.get('feedback') == '当前模拟环境尚未实现此操作，本次操作未执行。你可以尝试其他方式。':
        policy['feedback'] = POLICY['feedback']
    path.write_text(json.dumps(policy, ensure_ascii=False, indent=2) + '\n')
    (task / 'tests/unsupported-policy.json').write_text(path.read_text())
    docker = task / 'environment/mock.Dockerfile'
    s = docker.read_text().replace('lark-gym-mock:0.2.0', 'lark-gym-mock:0.2.2').replace('lark-gym-mock:0.2.1', 'lark-gym-mock:0.2.2')
    if 'unsupported.ts' not in s:
        s += 'COPY unsupported.ts unsupported-policy.json /opt/mock/\n'
    s = re.sub(r'^CMD .*\n?', '', s, flags=re.M)
    s += 'CMD ["--unsupported-hook", "/opt/mock/unsupported.ts", "--unsupported-policy", "/opt/mock/unsupported-policy.json", "--abort-signal", "/run/task-control/abort.json"]\n'
    docker.write_text(s)
    (task / 'environment/agent-lifetime.mjs').write_text(Path(__file__).with_name('agent-lifetime.mjs').read_text())
    docker = task / 'environment/Dockerfile'
    s = docker.read_text().replace('lark-gym-cli:0.2.0', 'lark-gym-cli:0.2.1')
    if 'COPY agent-lifetime.mjs' not in s:
        s += 'COPY agent-lifetime.mjs /opt/task/agent-lifetime.mjs\n'
    docker.write_text(s)
    compose = task / 'environment/docker-compose.yaml'
    s = compose.read_text()
    if 'task-control' not in s:
        s = s.replace('  main:\n', '  main:\n    init: false\n    entrypoint: ["node", "/opt/task/agent-lifetime.mjs"]\n    command: []\n    volumes:\n      - task-control:/run/task-control:ro\n', 1)
        s = re.sub(r'^  mock:\n', '  mock:\n    volumes:\n      - task-control:/run/task-control\n', s, count=1, flags=re.M)
        s += 'volumes:\n  task-control: {}\n'
    compose.write_text(s)

def install(task):
    task_config = task / 'task.toml'
    config = task_config.read_text().replace('version = "0.1.0"', 'version = "0.2.0"')
    config = re.sub(r'(\[verifier\]\s*timeout_sec\s*=\s*)([0-9.]+)', lambda match: match[1] + str(max(300.0, float(match[2]))), config)
    task_config.write_text(config)
    install_environment(task)
    for name in ('semantic.ts', 'semantic.toml', 'evaluate.ts', 'semantic-evidence.ts'):
        (task / 'tests' / name).write_text(Path(__file__).with_name(name).read_text())
    (task / 'tests/task-instruction.md').write_text((task / 'instruction.md').read_text())
    semantic_config = task / 'tests/semantic-config.json'
    if not semantic_config.exists():
        semantic_config.write_text(json.dumps({'enabled': True, 'text_fields': ['subject', 'description', 'body', 'text', 'notes', 'note', 'summary', 'reason', 'comment', 'content', 'body_text', 'message', 'caption', 'requirements'], **json.loads(Path(__file__).with_name('semantic-overrides.json').read_text()).get(task.name, {})}, indent=2) + '\n')
    (task / 'tests/test.sh').write_text('#!/bin/sh\nset -eu\nnode /tests/evaluate.ts\n')
    (task / 'tests/Dockerfile').write_text('FROM lark-gym-verifier:0.3.0\nCOPY . /tests\nWORKDIR /tests\n')
    verifier = task / 'tests/verify.ts'
    s = verifier.read_text()
    if 'scoreUnsupported' not in s:
        s = "import { scoreUnsupported } from './unsupported.ts';\n" + s
        s = s.replace('  unchanged &&\n  covered;', '  unchanged;')
        s = s.replace('writeFileSync(\n  `${output}/result.json`,', '''const coverage = scoreUnsupported(success ? 1 : 0, calls,
  JSON.parse(readFileSync(new URL('./unsupported-policy.json', import.meta.url), 'utf8')));
writeFileSync(`${output}/unsupported.json`, JSON.stringify(coverage, null, 2));
writeFileSync(
  `${output}/result.json`,''')
        s = s.replace('      success,\n', '      success,\n      coverage,\n')
        s = s.replace('if (!covered) {', 'if (!coverage.valid_sample) {')
        s = s.replace("writeFileSync(`${output}/reward.txt`, success ? '1\\n' : '0\\n');", "writeFileSync(`${output}/reward.txt`, `${coverage.reward}\\n`);")
        verifier.write_text(s)
    s = verifier.read_text()
    if 'prepareSemantic' not in s:
        s = "import { prepareSemantic } from './semantic.ts';\n" + s
        marker = 'const checks = expected.updates.map'
        s = s.replace(marker, "const semantic = prepareSemantic(expected, world, new URL('./semantic-config.json', import.meta.url));\n" + marker)
        s = s.replace('      success,\n', '      success: coverage.valid_sample && success,\n      business_success: success,\n      semantic,\n')
        verifier.write_text(s)
    # Pass authoritative initial state for reviewed structural equivalences.
    s = verifier.read_text()
    s = s.replace("  new URL('./semantic-config.json', import.meta.url),\n);", "  new URL('./semantic-config.json', import.meta.url),\n  seed,\n);")
    s = s.replace("new URL('./semantic-config.json', import.meta.url));", "new URL('./semantic-config.json', import.meta.url), seed);")
    # Restore absent fields by removing them, not by leaving undefined keys.
    # Only tasks explicitly reviewed against case-insensitive source assertions
    # enable this mode; all other creation substring checks retain their behavior.
    s = s.replace('contains[key].every((part) => String(r.fields[key]).includes(part))',
        'contains[key].every((part) => semantic.creationContainsCaseInsensitive\n'
        '  ? String(r.fields[key]).toLowerCase().includes(part.toLowerCase())\n'
        '  : String(r.fields[key]).includes(part))')
    s = s.replace('if (after) after.fields[check.field] = before.fields[check.field];',
        'if (after) {\n    if (Object.hasOwn(before.fields, check.field)) after.fields[check.field] = before.fields[check.field];\n    else delete after.fields[check.field];\n  }')
    if 'semantic.literalMessageChecks.every' not in s:
        marker = '  messageChecks.every((c) => c.passed) &&'
        if marker not in s:
            raise ValueError(f"Missing message-check gate in {verifier}")
        s = s.replace(marker, marker + '\n  semantic.literalMessageChecks.every((c) => c.passed) &&')
    if 'semantic.recordGroupChecks.every' not in s:
        marker = '  semantic.literalMessageChecks.every((c) => c.passed) &&'
        if marker not in s:
            raise ValueError(f"Missing literal gate in {verifier}")
        s = s.replace(marker, marker + '\n  semantic.recordGroupChecks.every((c) => c.passed) &&')
    if 'semantic.literalCellChecks.every' not in s:
        marker = '  semantic.recordGroupChecks.every((c) => c.passed) &&'
        if marker not in s:
            raise ValueError(f"Missing record gate in {verifier}")
        s = s.replace(marker, marker + '\n  semantic.literalCellChecks.every((c) => c.passed) &&')
    verifier.write_text(s)

    expected_path = task / 'tests/expected.json'
    if expected_path.exists() and json.loads(expected_path.read_text()).get('booking_order'):
        (task / 'tests/booking-order.ts').write_text(Path(__file__).with_name('booking-order.ts').read_text())
        s = verifier.read_text()
        if 'checkBookingOrder' not in s:
            s = "import { checkBookingOrder } from './booking-order.ts';\n" + s
            s = s.replace('const success =', 'const bookingOrderChecks = checkBookingOrder(expected, calls);\nconst success =')
            marker = '  orderChecks.every((c) => c.passed) &&'
            if marker not in s:
                raise ValueError(f"Missing ordering gate in {verifier}")
            s = s.replace(marker, marker + '\n  bookingOrderChecks.every((c: { passed: boolean }) => c.passed) &&')
            s = s.replace('      orderChecks,', '      orderChecks,\n      bookingOrderChecks,')
            verifier.write_text(s)

if __name__ == '__main__':
    for task in sorted((ROOT / 'tasks').glob('automationbench-*')):
        install(task)
