审查 ss_safety/ws_incidents，仅处理 Investigation Status=New，跳过 Under Investigation 和 Near Miss。Critical 在 proj_safety 创建 Jira 工单、短信通知 +15558001001 并发 safety-critical；Major 建工单并发 safety-incidents；Minor 仅建工单。全部工单包含 incident type、location、severity。Jira 适配为 jira_issues（project、issuetype、reference、summary、description），短信适配为电话号码 IM。引用来源值时原样保留，不改写或取整。

相关来信通过飞书邮件读取；不发送任务未要求的邮件。业务材料中的来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
