处理所有 handoff-requested HelpScout 会话，查 ss_handoff/ws_routing 逐项评估，将有效交接转正确 mailbox、加备注，适当处理无效或无匹配请求，每个处理项向 support-handoffs 通知，含相关实体名称。使用 help_conversations、help_notes、help_replies；Gmail 适配为飞书邮箱。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
