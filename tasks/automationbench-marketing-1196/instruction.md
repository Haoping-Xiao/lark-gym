今天为 2026-01-28。检查 Sponsor Tracker（ss_sponsor / ws_invoices），向已批准且到期的赞助商发送飞书邮件账单，Status 改为 Invoiced。先查阅 Finance 的处理要求和审计要求，来源金额照录，消息包含赞助商姓名。账单由邮件正文承载，无需另建财务实体。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-01-28T10:00:00Z 为时间基准。
