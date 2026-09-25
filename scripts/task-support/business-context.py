"""Keep user requests separate from execution rules and generated catalogues.

Resources are discoverable through Drive, Base, Sheets and IM. A task's business
reference time remains explicit in its user request; it is not the host clock.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OVERRIDES = json.loads(Path(__file__).with_name('user-request-overrides.json').read_text())
MARKERS = ['\n\n使用本环境的 Mock 版', '\n\n业务台账位于', '\n\n使用 Mock 版']

for task in sorted((ROOT / 'tasks').iterdir()):
    instruction = task / 'instruction.md'
    seed_path = task / 'environment/seed.json'
    if not instruction.exists() or not seed_path.exists():
        continue
    text = instruction.read_text()
    positions = [text.index(marker) for marker in MARKERS if marker in text]
    if positions:
        text = text[:min(positions)]
    text = OVERRIDES.get(task.name, text).strip()
    # Remove recurring migration boilerplate, never business names or values.
    text = re.sub(r'\n\n原财务系统改为飞书多维表格财务台账：[^\n]+', '', text)
    text = re.sub(r'组织记录 ID 为 rec_zendesk_ 加原始 ID。', '', text)
    text = re.sub(r'[，；]记录 ID 为 rec_(?:zendesk|helpscout)_ 加原始\s*(?:会话\s*)?ID', '', text)
    for old, new in {
        '，此环境用来源关联群消息替代原平台线程回复': '',
        '本环境未实现Zoom waiting room，要求waiting room的安全控制明确适配为vc_data.meeting_settings.join_meeting_permission=only_event_attendees，不声称实现主持人逐人放行': '会议入会权限仅限受邀人，不启用主持人逐人放行',
        'uri仅本环境业务引用，不声称真实网页': 'uri 是台账内的业务引用，不作为网页链接',
        '；本环境以群内来源关联消息替代原平台线程回复': '',
        '（替代原平台thread）': '',
        'Tier 2 的 CC 在本环境改为给': 'Tier 2 同时给',
        '此任务使用模拟材料中的规则。': '',
        '本模拟规则：': '本次工作底稿的纳入标准：',
        '这组规则仅为本题定义。': '',
        '本环境没有独立租约正文，不能声称已完成合同核验：': '租约协议尚待核验，',
        '需要博客响应时，本环境用 blog-team 群中的逐项撰稿请求交由编辑执行': '需要博客响应时，在 blog-team 群逐项请求编辑撰稿',
        '（本题的模拟参保完成动作）': '',
        '本轮是模拟存款记账。': '本次只做存款登记。',
        '只是模拟记账。': '本次只做账簿登记。',
        '模拟记账不做真实支付': '只做账簿登记，不发起支付',
        '飞书模拟电汇记录': '电汇演练记录',
        '来源 Status=Sent 只表示模拟执行。': '本次为电汇演练，Sent 表示演练登记完成。',
        '这里只管理模拟社媒业务记录。': '本次只管理社媒业务台账。',
        '本题支付只模拟登记': '本次仅在付款登记簿登记：',
        '作为模拟撤回记录': '作为撤回处理记录',
        '模拟动作非真实账号操作': '本次仅登记账号恢复计划，不直接操作账号',
        '本环境把发送 Google Ads 转化改为 google_ads_conversions 飞书台账：': '将 Google Ads 转化登记到 google_ads_conversions 台账：',
        '付款只在飞书模拟台账记录：': '本次仅做付款台账登记：',
        '明确模拟记账不代表真实银行付款': '通知中明确本次为账簿登记，未向银行发起付款',
        '只模拟告警流程': '本次为告警演练',
        '此环境把 invoice_total 视为含税总额': 'invoice_total 为含税总额',
        '日终模拟归集': '日终归集演练',
        '这里仅执行题内模拟政策，不代表现实贸易或运输合规判断。': '本次仅准备内部申报材料，不向监管机构提交。',
        '来源手册是本模拟企业的路由规则，不执行真实监管申报；': '按企业内部路由手册处理，本次不向监管机构申报；',
        '作为模拟人事记录变更': '作为本轮人事变更登记',
        '代表本模拟环境发布，不访问外网': '本次只登记发布记录，不向外部平台发布',
    }.items():
        text = text.replace(old, new)
    seed = json.loads(seed_path.read_text())
    now = seed['now']
    if now not in text:
        text += f'\n\n本次业务处理以 {now} 为时间基准。'
    instruction.write_text(text + '\n')
    guide = task / 'environment/AGENTS.md'
    guide.unlink(missing_ok=True)
    docker = task / 'environment/Dockerfile'
    docker.write_text(''.join(line for line in docker.read_text().splitlines(keepends=True)
                             if not line.startswith('COPY AGENTS.md ')))
