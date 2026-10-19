按标准流程为所有已就绪交易发送合同，逐项选择正确协议类型，发给 primary contact，并在 opportunity description 记录模板使用。DocuSign 适配为 signature_requests（opportunity_id、template_id、template_name、signer_email、status=Sent）及实际邮件请求，CRM 使用 opportunities。

来信读取及向邮箱地址发送通知均使用飞书邮件；手机号及员工账号对应的通知使用已提供的飞书私聊，群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
