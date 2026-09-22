"""Install task-owned environment policy hooks without replacing task graders."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
POLICY = dict(version=1, penalty_per_call=0, max_penalty=None, score_floor=0,
              exclude_from_valid_samples=True,
              feedback='当前模拟环境尚未实现此操作，本次操作未执行。你可以尝试其他方式。')

def install(task):
    task_config = task / 'task.toml'
    config = task_config.read_text().replace('version = "0.1.0"', 'version = "0.2.0"')
    config = re.sub(r'(\[verifier\]\s*timeout_sec\s*=\s*)([0-9.]+)', lambda match: match[1] + str(max(300.0, float(match[2]))), config)
    task_config.write_text(config)
    for directory in ('environment', 'tests'):
        (task / directory / 'unsupported.ts').write_text(Path(__file__).with_name('unsupported.ts').read_text())
    policy = task / 'environment/unsupported-policy.json'
    if not policy.exists():
        policy.write_text(json.dumps(POLICY, ensure_ascii=False, indent=2) + '\n')
    (task / 'tests/unsupported-policy.json').write_text(policy.read_text())
    docker = task / 'environment/mock.Dockerfile'
    s = docker.read_text()
    if 'unsupported.ts' not in s:
        s += '''COPY unsupported.ts unsupported-policy.json /opt/mock/
CMD ["--unsupported-hook", "/opt/mock/unsupported.ts", "--unsupported-policy", "/opt/mock/unsupported-policy.json"]
'''
        docker.write_text(s)
    for name in ('semantic.ts', 'semantic.toml', 'evaluate.ts'):
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
    verifier.write_text(s)

if __name__ == '__main__':
    for task in sorted((ROOT / 'tasks').glob('automationbench-*')):
        install(task)
