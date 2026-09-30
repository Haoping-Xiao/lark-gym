按Signing Process Policy发送PartnerCorp partnership agreement。DocuSign顺序签署改signature_requests台账（opportunity_id/template_id/template_name/status=Sent、signers为含name/email/routing_order的JSON数组，按签署顺序排列）。只给首位当前可签人邮件发出，后续签署人在台账排队，不伪造前序完成也不提前催签；本题不模拟后续签署执行。发出后opportunity description记录signing routing order与金额。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
