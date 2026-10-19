检查 frontdesk@company.example.com 最新 visitor NDA 邮件，为 base_ops/Visitors 对应访客记录添加 NDA 完成评论，并邮件 host-ops@company.example.com 通知主人。Airtable 评论适配为 airtable_comments（applicationId、tableName、recordId、commentText），记录引用来自源邮件。引用来源值时原样保留，不改写或取整。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
