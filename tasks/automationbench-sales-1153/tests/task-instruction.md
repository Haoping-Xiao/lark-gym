处理未来30个自然日（今天起含边界、不含已过期）到期合同，按VP Renewal Policy决定发送或手工复核。发出续约改signature_requests台账（source_envelope_id/opportunity_id/template_id/template_name/signer_name/email/amount/status=Sent）加签署人邮件；已处理opportunity stage改Renewal，有实际续约报价才更新amount，否则保留原金额并建tasks手工复核（subject包含Manual review及客户、related_to_id为商机、status=Not Started）。不要给未授权客户发送或处理窗口外合同。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-01-21T10:00:00Z 为时间基准。

邮件的 internal_date=0 表示来源未提供时间，不代表该邮件发生于 1970 年；请结合材料内容及明确日期判断。
