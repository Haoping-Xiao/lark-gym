"""Inventory every task's business mapping and scoring risks, without claiming parity."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

def inventory():
    items = []
    for task in sorted((ROOT / 'tasks').iterdir()):
        if not task.is_dir(): continue
        seed_path = task / 'environment/seed.json'
        if not seed_path.exists(): continue
        seed = json.loads(seed_path.read_text())
        expected_path = task / 'tests/expected.json'
        expected = json.loads(expected_path.read_text()) if expected_path.exists() else {}
        collections = sorted({str(r['fields'].get('collection', '')) for r in seed.get('base', {}).get('records', [])} | {str(r.get('collection', '')) for r in expected.get('creates', [])})
        risks = []
        for key in ('forbidden_messages', 'forbidden_records'):
            for i, check in enumerate(expected.get(key, [])):
                if check.get('contains'):
                    risks.append({'check': f'{key}[{i}]', 'kind': 'substring_is_not_business_action'})
        for i, check in enumerate(expected.get('messages', [])):
            if check.get('contains'):
                risks.append({'check': f'messages[{i}]', 'kind': 'review_literal_vs_semantic_requirement'})
        items.append({
            'task': task.name,
            'business_storage': {'base_collections': collections, 'business_tables': [{'id': t['table_id'], 'name': t['name']} for t in seed.get('base', {}).get('tables', [])], 'spreadsheets': sorted(seed.get('spreadsheets', {})), 'calendar_count': len(seed.get('calendars', [])), 'chat_count': len(seed.get('chats', []))},
            'grading_review': risks,
            'verifier_sha256': hashlib.sha256((task / 'tests/verify.ts').read_bytes()).hexdigest(),
            'live_tenant_parity': 'not_run',
            'astra_exploration': 'not_run',
        })
    return items

if __name__ == '__main__':
    output = ROOT / 'reports/task-audit.json'
    output.parent.mkdir(exist_ok=True)
    output.write_text(json.dumps({'scope': 'all native tasks; risk inventory is not a claim of semantic correctness or production parity', 'tasks': inventory()}, ensure_ascii=False, indent=2) + '\n')
