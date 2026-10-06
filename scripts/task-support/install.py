"""Stage shared runtime and verifier sources into self-contained task packages."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
def install_environment(task):
    """Select the shared backend image; task packages own their service layout."""
    docker = task / 'environment/mock.Dockerfile'
    docker.write_text(re.sub(r'(?m)^FROM lark-gym-mock:[0-9.]+$',
                            'FROM lark-gym-mock:0.2.17', docker.read_text()))


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
    if 'prepareSemantic' not in s:
        s = "import { prepareSemantic } from './semantic.ts';\n" + s
        marker = 'const checks = expected.updates.map'
        s = s.replace(marker, "const semantic = prepareSemantic(expected, world, new URL('./semantic-config.json', import.meta.url));\n" + marker)
        s = s.replace('      success,\n', '      success,\n      business_success: success,\n      semantic,\n')
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
