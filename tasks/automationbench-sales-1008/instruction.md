完成 Acme 合作交易合同流程，遵循标准政策并更新 Salesforce。DocuSign 适配为 signature_requests（template_id、template_name、account_id、opportunity_id、recipient_email、status=Sent、amount、subject、deadline、revenue_share、territory、term）加原生邮件签署请求，CRM 使用 opportunities；Calendly 类型使用 calendly_event_types。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2024-01-24T10:00:00Z 为时间基准。
