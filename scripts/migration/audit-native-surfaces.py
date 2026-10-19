"""Inventory source-to-Lark mappings; flags are review candidates, not certification.

Usage: python scripts/migration/audit-native-surfaces.py SOURCE_JSON OUTPUT_JSON
The source export is read-only. This command never invokes a model or mutates tasks.
"""
import collections
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def audit(source_path):
    sources = json.loads(Path(source_path).read_text())
    recipes = json.loads((ROOT / 'scripts/migration/formal.zh.json').read_text())
    rows = []
    for source in sources:
        key = f"{source['domain']}-{source['example_id']}"
        name = 'automationbench-' + key
        task = ROOT / 'tasks' / name
        info = source['info']
        state = info.get('initial_state', {})
        assertions = info.get('assertions', [])
        seed = json.loads((task / 'environment/seed.json').read_text())
        expected = json.loads((task / 'tests/expected.json').read_text())
        recipe = recipes.get(key, {})
        request = (task / 'instruction.md').read_text()
        mail_assertions = [a['type'] for a in assertions if a['type'].startswith('gmail_')]
        mail_source = bool(state.get('gmail'))
        mail_tools = [t for t in info.get('zapier_tools', []) if t.startswith('gmail_')]
        source_mail_scope = bool(mail_source or mail_assertions or mail_tools)
        has_mail_scope = bool(source_mail_scope or seed.get('mail') or expected.get('mail') or any(m.get('email') for m in recipe.get('messages', [])))
        has_native_mail = 'mail' in seed
        legacy_chats = [c['chat_id'] for c in seed.get('chats', [])
                        if c['chat_id'] == 'oc_mail' or c['chat_id'].startswith('oc_email_')]
        legacy_mail_writes = sorted({c.get('collection', '') for c in expected.get('creates', [])
                                    if c.get('collection', '') in ['mail_drafts', 'mail_labels', 'mail_messages']})
        flags = []
        if has_mail_scope and not has_native_mail:
            flags.append('mail.native_state_missing')
        if has_mail_scope and legacy_chats:
            flags.append('mail.legacy_im_mapping')
        if legacy_mail_writes:
            flags.append('mail.state_writes_in_base')
        if has_mail_scope and re.search(r'(邮件.{0,12}(?:改为|改用|替代|映射).{0,8}(?:IM|私聊|群消息)|邮箱IM)', request, re.I):
            flags.append('mail.request_uses_im_substitute')
        # These indicate business-semantic review, not proof that a task is wrong.
        collections_written = sorted({c.get('collection', '') for c in expected.get('creates', [])})
        review = []
        if any(c.startswith(('zoom_', 'calendly_')) for c in collections_written):
            review.append('meeting_or_scheduling_ledger')
        if any(c.startswith(('google_drive_', 'confluence_', 'notion_')) for c in collections_written):
            review.append('document_or_file_ledger')
        if any(c.startswith(('buffer_', 'twitter_', 'linkedin_', 'facebook_', 'instagram_', 'google_ads_', 'docusign_', 'twilio_')) for c in collections_written):
            review.append('external_action_business_adaptation')
        special_mail = any(any(part in t for part in ['draft', 'label', 'read']) for t in mail_assertions)
        mail_kind = ('draft_or_mutable' if special_mail else 'outgoing'
                     if any(m.get('email') for m in recipe.get('messages', [])) else 'source_only')
        rows.append({
            'task': name, 'source_domain': source['domain'],
            'source_apps': sorted(k for k, v in state.items() if k != 'meta' and v),
            'source_mail_scope': source_mail_scope, 'mail_scope': has_mail_scope, 'mail_kind': mail_kind if has_mail_scope else None,
            'source_mail_messages': len(state.get('gmail', {}).get('messages', [])),
            'mail_assertion_types': sorted(set(mail_assertions)),
            'native_mail_state': has_native_mail,
            'legacy_mail_chats': len(legacy_chats),
            'legacy_mail_write_collections': legacy_mail_writes,
            'native_documents': len(expected.get('documents', [])),
            'native_file_moves': len(expected.get('file_moves', [])),
            'native_folder_creates': len(expected.get('folder_creates', [])),
            'base_write_collections': collections_written,
            'mail_flags': flags, 'business_review_candidates': review,
        })
    return {
        'scope': 'static mapping inventory only; execution and semantic acceptance are separate',
        'counts': {
            'tasks': len(rows),
            'source_mail_tasks': sum(r['source_mail_scope'] for r in rows),
            'mail_tasks': sum(r['mail_scope'] for r in rows),
            'mail_tasks_with_native_state': sum(r['mail_scope'] and r['native_mail_state'] for r in rows),
            'mail_tasks_missing_native_state': sum(r['mail_scope'] and not r['native_mail_state'] for r in rows),
            'mail_flagged_tasks': sum(bool(r['mail_flags']) for r in rows),
            'other_business_review_tasks': sum(bool(r['business_review_candidates']) for r in rows),
            'missing_mail_by_kind': dict(collections.Counter(r['mail_kind'] for r in rows if r['mail_scope'] and not r['native_mail_state'])),
            'other_business_review_by_kind': dict(collections.Counter(x for r in rows for x in r['business_review_candidates'])),
        },
        'tasks': rows,
    }


if __name__ == '__main__':
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    result = audit(sys.argv[1])
    output = Path(sys.argv[2])
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(result['counts'], ensure_ascii=False, indent=2))
