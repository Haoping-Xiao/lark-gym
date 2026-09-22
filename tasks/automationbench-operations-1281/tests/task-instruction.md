读完整support来信及所有Escalation Rules/内部incident/suspension邮件。本例无回复历史，明确候选为当前未读且subject含urgent或critical的外部来信；Reviewed计候选数（含随后排除的测试/已解决/停用），qualified计可建单数；选择最近一条有效升级。HubSpot改tickets(subject=原subject/priority=HIGH/description/external_id=ticket:<源message_id>)，描述含客户邮箱、损失及active bridge；业务external_id作为回执单号，不冒充随机record_id。support-escalations通知Urgent ticket created、主题邮箱、Reviewed N/qualified N及损失；私聊客户确认received和escalated并附业务单号。按政策，synthetic另私聊engineering@company.example.com，suspended另私聊billing@company.example.com转交原主题、邮箱和原因（这两地址是本适配补定的内部路由），不另建ticket、不向已解决者发送升级确认。

本次业务处理以 2026-01-29T19:00:00Z 为时间基准。
