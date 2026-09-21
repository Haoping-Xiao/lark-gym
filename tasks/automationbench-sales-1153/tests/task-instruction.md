处理未来30个自然日（今天起含边界、不含已过期）到期合同，按VP Renewal Policy决定发送或手工复核。发出续约改signature_requests台账（source_envelope_id/opportunity_id/template_id/template_name/signer_name/email/amount/status=Sent）加签署人私聊；已处理opportunity stage改Renewal，有实际续约报价才更新amount，否则保留原金额并建tasks手工复核（subject包含Manual review及客户、related_to_id为商机、status=Not Started）。不要给未授权客户发送或处理窗口外合同。

# 操作环境

使用本环境的 Mock 版 lark-cli。业务资料按实体分别存入飞书多维表格，表目录见下方。记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

当前时间固定为 2026-01-21T10:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_bc62a3c14fec：客户公司（来源实体 accounts）
- tbl_aa5af4084f37：联系人（来源实体 contacts）
- tbl_8e838d8ac54d：docusign_envelopes（来源实体 docusign_envelopes）
- tbl_67e8f5b89016：docusign_templates（来源实体 docusign_templates）
- tbl_9be34f3e549c：商机（来源实体 opportunities）
- tbl_b7e9da2f823c：signature_requests（来源实体 signature_requests）
- tbl_085154084c74：工作事项（来源实体 tasks）
