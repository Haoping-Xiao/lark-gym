处理procurement@company.example.com所有未读vendor reviews，精确匹配tbl_ops里pipefy_find_database_records实体。Approved写phase_id=phase_approved/field_status=Approved；Rejected写phase_rejected/Rejected；Conditional写phase_pending_docs/Pending Docs。每个处理项分别邮件procurement确认名称、原decision及实际phase/status，若有原因也原文保留。已读条目不重做，不合并相近vendor名。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
