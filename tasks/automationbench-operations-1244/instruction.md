从 ss_escalations/ws_pending 处理最关键的企业客户问题，遵循全部升级政策，包括 reference ID 格式和 CSM 归属要求。通过 Salesforce 和 Jira Customer Escalations 项目升级，在 cloud_ops/SP_ESCALATIONS 记录，并向 escalations 与 account-management 通知当前 ARR。飞书适配：cases（account_id、subject、priority、status、reference），jira_issues（project、issuetype、summary、reference），SP_ESCALATIONS 下原生文档；priority/status 可用 High、New。引用来源值和相关金额时原样保留，不改写或取整。

相关来信通过飞书邮件读取；不发送任务未要求的邮件。业务材料中的来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。

文档必须通过飞书 Docs 创建，使用 Markdown 内容；不在 Base 表里登记页面来替代文档。本题将原目录映射为飞书云盘目录 SP_ESCALATIONS。 可用 docs +create / +fetch / +update，均指定 --doc-format markdown；云盘目录使用 drive files list 查询。
