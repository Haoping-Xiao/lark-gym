处理 Deal Closed 通知邮件，定位商机，按 contract routing guidelines 向正确签署人发送合适合同模板，更新商机记录所发内容，并对大额交易提醒团队。DocuSign 适配为 signature_requests（opportunity_id、template_id、template_name、signer_name、signer_email、status=Sent）和原生邮件签署请求；商机使用 opportunities。通知包含相关实体名称和金额。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。

邮件的 internal_date=0 表示来源未提供时间，不代表该邮件发生于 1970 年；请结合材料内容及明确日期判断。
