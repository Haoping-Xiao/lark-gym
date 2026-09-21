今天2026-02-15，依据Invoice Sending Rules及客户暂缓请求，发送尚未送达且可发送的Xero发票。在飞书私聊向客户发送完整发票号、客户名称、原total、amount_due；CC CFO改为给cfo@company.example.com发同内容私聊。随后将已发送发票sent_to_contact设true，向billing群汇总真正发送的发票及金额，不把未发送发票混进汇总。原始账单记录中布尔值采用JSON文本true/false。

# 操作环境

使用本环境的 Mock 版 lark-cli。业务资料按实体分别存入飞书多维表格，表目录见下方。记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

当前时间固定为 2026-02-15T10:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_8d06bf617dbb：xero_contacts（来源实体 xero_contacts）
- tbl_8418b0d8813b：xero_invoices（来源实体 xero_invoices）
