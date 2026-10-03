今天2026-01-22，按最新合规模板规则为本周（周一至今天）Closed Won商机发送合同。DocuSign改每商机一条signature_requests台账，opportunity_id/template_id/template_name/status=Sent；signers存JSON数组，依次主要签署人、需要时legal counsel，成员项含name/email，不能假造签署完成。向所有签署人邮件对应商机、模板和金额，发出后才把模板名追加opportunity description；原null表示无内容，不需把null字面加入日志。

来信读取及向邮箱地址发送通知均使用飞书邮件；手机号及员工账号对应的通知使用已提供的飞书私聊，群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-01-22T10:00:00Z 为时间基准。
