查看facilities incidents及escalation rules，选择最紧急可升级的Open事件；同优先级先Impact=Critical，再最小Severity，再最早Reported。查jira_project精确匹配Operations Support。飞书Base新建jira_issues(project/issuetype=Incident/summary/external_id=incident:<Location>)，飞书文档(父目录=SP_OPS/title=Incident - <Location>/body为Summary原文)。将ops-team@company.example.com作为本题ops团队接收地址，先邮件通知，再建jira_comments(issue_external_id/comment含notified)。不要在未通知时记已通知，也不要修改原事件表。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。

文档必须通过飞书 Docs 创建，使用 Markdown 内容；不在 Base 表里登记页面来替代文档。本题将原目录映射为飞书云盘目录 SP_OPS。 可用 docs +create / +fetch / +update，均指定 --doc-format markdown；云盘目录使用 drive files list 查询。
