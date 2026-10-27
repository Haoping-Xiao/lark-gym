"""Report instruction additions for human review; never infer semantic equivalence."""
import argparse
import hashlib
import json
import re
from pathlib import Path

PATTERNS = {
    'email': r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}',
    'date': r'\b\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2})?(?:Z|[+-]\d{2}:\d{2})?)?\b|\d{1,2}月\d{1,2}日',
    'number': r'(?<![A-Za-z0-9_])[-+]?\d+(?:,\d{3})*(?:\.\d+)?%?',
    'conclusion': r'[^。！？\n]*(?:不得|不能|跳过|不自动生效|以[^。！？\n]{1,30}为准|优先|仅限|不应|只处理|不要|禁止|上限|阈值)[^。！？\n]*[。！？]?',
}

def candidates(source, instruction):
    result = []
    protected = [(m.start(), m.end()) for kind in ('email', 'date')
                 for m in re.finditer(PATTERNS[kind], instruction)]
    for kind, pattern in PATTERNS.items():
        source_values = {m.group(0).replace(',', '') for m in re.finditer(pattern, source)}
        seen = set()
        for match in re.finditer(pattern, instruction):
            if kind == 'number' and any(start <= match.start() < end for start, end in protected):
                continue
            value = match.group(0).strip()
            if not value or value in seen or value.replace(',', '') in source_values:
                continue
            seen.add(value)
            result.append({'kind': kind, 'value': value, 'line': instruction[:match.start()].count('\n') + 1})
    return result

def audit(source_path, repo, output):
    manifest = json.loads((repo / 'scripts/migration/automationbench.json').read_text())
    whitelist = json.loads((repo / 'scripts/migration/instruction-whitelist.json').read_text())
    rows = json.loads(source_path.read_text())
    sources = {}
    for row in rows:
        task = 'automationbench-{}-{}'.format(row['domain'], row['example_id'])
        if task in sources:
            raise ValueError('Duplicate upstream task: ' + task)
        sources[task] = '\n\n'.join(p['content'] for p in row['prompt'] if p['role'] == 'user')
    expected = {Path(t['target']).name for t in manifest['tasks']}
    if set(sources) != expected:
        raise ValueError('Upstream inventory differs from task manifest')
    if set(whitelist) - expected:
        raise ValueError('Unknown whitelist task')
    reports = []
    for task in sorted(expected):
        instruction = (repo / 'tasks' / task / 'instruction.md').read_text()
        allow = whitelist.get(task, [])
        for entry in allow:
            if set(entry) != {'kind', 'value', 'reason'} or not entry['reason'].strip():
                raise ValueError('Whitelist needs exact kind/value and reason: ' + task)
        findings = candidates(sources[task], instruction)
        for finding in findings:
            accepted = next((a for a in allow if a['kind'] == finding['kind'] and a['value'] == finding['value']), None)
            finding['status'] = 'allowed' if accepted else 'needs_review'
            if accepted:
                finding['reason'] = accepted['reason']
        reports.append({'task': task, 'instruction_sha256': hashlib.sha256(instruction.encode()).hexdigest(), 'findings': findings})
    output.mkdir(parents=True, exist_ok=True)
    (output / 'source-prompts.json').write_text(json.dumps({'source': manifest['source'], 'commit': manifest['commit'], 'prompts': sources}, ensure_ascii=False, indent=2) + '\n')
    (output / 'report.json').write_text(json.dumps(reports, ensure_ascii=False, indent=2) + '\n')
    lines = ['# Instruction additions requiring review', '', 'Lexical candidates only: cross-language meaning and hidden policy leaks require manual review.', '']
    for report in reports:
        findings = [f for f in report['findings'] if f['status'] == 'needs_review']
        if findings:
            lines += ['## ' + report['task'], '']
            lines += ['- line {} / {}: {}'.format(f['line'], f['kind'], f['value'].replace('\n', ' ')) for f in findings]
            lines += ['']
    (output / 'report.md').write_text('\n'.join(lines) + '\n')
    print('{} tasks; {} candidates need review'.format(len(reports), sum(f['status'] == 'needs_review' for r in reports for f in r['findings'])))

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('source', type=Path)
    parser.add_argument('--repo', type=Path, default=Path('.'))
    parser.add_argument('--output', type=Path, default=Path('runs/instruction-audit'))
    args = parser.parse_args()
    audit(args.source, args.repo, args.output)
