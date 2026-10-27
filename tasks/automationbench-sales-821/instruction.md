处理邮箱中未读合同更新请求，按标准流程作废旧合同、用正确模板重发、更新 CRM 并向请求 rep 确认，通知含相关实体名称和金额。旧合同适配为 docusign_envelopes（status、voided_reason），新请求为 signature_requests（previous_envelope_id、opportunity_id、template_id、template_name、signer_name、signer_email、amount、term_months、special_terms、status=Sent）及实际邮件；CRM 使用 opportunities。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
