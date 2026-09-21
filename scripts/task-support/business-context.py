"""Separate user requests from execution documentation for every native task."""
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
LABELS = {'tickets':'客服工单','cases':'客户服务工单','contacts':'联系人','leads':'销售线索','opportunities':'销售商机','deals':'销售商机','accounts':'客户公司','companies':'客户公司','tasks':'工作事项','notes':'业务备注','events':'会议历史','campaigns':'营销活动','issues':'研发问题','cards':'看板卡片','posts':'内容排期','lookup_users':'成员资料','lookup_groups':'客服组资料'}
for task in sorted((ROOT/'tasks').glob('automationbench-*')):
    instruction = task/'instruction.md'
    text = instruction.read_text()
    seed = json.loads((task/'environment/seed.json').read_text())
    expected = json.loads((task/'tests/expected.json').read_text())
    markers = ['\n\n使用本环境的 Mock 版', '\n\n业务台账位于', '\n\n使用 Mock 版']
    positions = [text.index(marker) for marker in markers if marker in text]
    if not positions: continue
    split = min(positions)
    user, technical = text[:split], text[split:].strip()
    if task.name == 'automationbench-simple-3151':
        user = '客户发来一个账单问题，请阅读来信，在客服工单台账里新建一条工单。'
    collections = sorted({str(r['fields'].get('collection','')) for r in seed['base']['records']} | {str(r.get('collection','')) for r in expected.get('creates',[])})
    collections = [c for c in collections if c]
    # Replace the unrelated all-business catalogue with this task's schema.
    if 'collection 字段区分 ' in technical:
        start = technical.index('collection 字段区分 ')
        end = technical.index('；lookup_ 开头', start)
        technical = technical[:start] + 'collection 字段区分 ' + '、'.join(f'{c}（{LABELS.get(c,c)}）' for c in collections) + technical[end:]
    technical = technical.replace('记录 ID 为 rec_ 加原业务 ID；', '记录 ID 通过查询获取；').replace('记录 ID 为 rec_ 加原业务 ID。', '记录 ID 通过查询获取。')
    guide = '# 操作环境\n\n' + technical + '\n'
    (task/'environment/AGENTS.md').write_text(guide)
    docker = task/'environment/Dockerfile'
    content = docker.read_text()
    if 'COPY AGENTS.md' not in content:
        docker.write_text(content + 'COPY AGENTS.md /workspace/AGENTS.md\n')
    instruction.write_text(user.strip() + '\n')
