按 ss_migration_rules 从 Freshdesk 向 Re:amaze 迁移合格内容，过程中登记跟踪记录，完成后向 support-migration@company.example.com 邮件报告，含相关实体名称。使用 freshdesk_tickets、contacts、reamaze_contacts、reamaze_conversations，目标 external_id 可用 freshdesk:<源id>；源缺独立跟踪表时使用 migration_log（source_ticket_id、target_external_id、status）。Gmail 适配为飞书邮箱。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
