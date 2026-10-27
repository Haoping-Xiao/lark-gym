按Offer Approvals和状态约定，仅为完全批准且尚未发送的offer发签署请求。DocuSign改为签署请求飞书台账signature_requests加候选人邮件，不提供外部电子签名能力。每个请求保存template_id、candidate、email、role、salary原文、start_date、status=Sent；邮件列候选人、Role、Salary、Start Date及请求签署。发送后才更新来源DocuSign Status为约定值。不把Sent当成已签署，也不修改审批结论。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-03-20T09:00:00Z 为时间基准。
