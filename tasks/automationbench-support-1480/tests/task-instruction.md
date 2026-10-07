按ss_bridge迁移enterprise标签客户的符合Create_Ticket=true的事件，不只看最后一条事件，未配置或false跳过。任务今天2026-02-07 09UTC优先于seed旧meta；本轮处理给出的全部事件。匹配zoho_desk_accounts完整公司名、contacts邮箱，有则复用，无才创建(account_name; contact email/first_name/last_name/account_name)。工单zoho_desk_tickets取Subject_Template/priority，status=Open/contact_email/account_name/source_customer_id/source_event完整JSON。每成功工单后新增helpcrunch_events(customer_id/event_name=HC_Event/source_event_name/subject/created_at当前时间)，不把事件当tag。enterprise-support报告bridge、数量、姓名/公司/工单/priority。

相关来信通过飞书邮件读取；不发送任务未要求的邮件。业务材料中的来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-07T09:00:00Z 为时间基准。
