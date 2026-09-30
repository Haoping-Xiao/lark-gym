核对ss_escalations全部规则和相关Finance/CSM邮件，从可处理Pending Enterprise中选择最高有效ARR的客户问题。Salesforce改cases记录(account_id/subject/priority=High/status=New/reference)，Jira改jira_issues(project从Customer Escalations查、issuetype=Incident/summary/reference)，Confluence改confluence_pages(cloudId=cloud_ops/space_id=SP_ESCALATIONS/type=page/title/body)。页面和escalations、account-management通知需保留当前ARR与reference，页面和account-management还写正确CSM。不存在CRM账号不得自行补建，不修改来源政策、ARR表或客户账户。通知或记录引用来源值时须原样保留，不得改写或舍入。

相关来信通过飞书邮件读取；不发送任务未要求的邮件。业务材料中的来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
