以HelpScout active会话完整email匹配hubspot_contacts再查associated_contact_ids关联deal；closedwon/closedlost排除，不能按邮箱域猜deal。未来0..30日含边界且amount>10000为critical，否则active deal为info。按配置critical才创建tasks(subject含dealname/deal_id/conversation_id/owner_email/priority=High/status=Not Started/amount原数字/description原会话subject)，并AE邮箱IM；无SF account不虚构。sales-support包含全部有效deal的name/原amount/close date/subject/level、critical/info计数及batch_id，不联系客户。

本次业务处理以 2026-02-07T09:00:00Z 为时间基准。
