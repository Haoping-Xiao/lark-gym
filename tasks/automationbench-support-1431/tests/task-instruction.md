今天为 2026-02-07，获取当前 HelpScout conversations，生成 daily support digest，分发到适当群和人员。使用 help_conversations；Gmail 适配为飞书邮箱，引用来源值时原样保留。 来源没有分发配置，本适配将未分配的 active/pending 会话发 support-daily，将 active 且 escalated 会话发 escalations；完整状态计数和待处理事项邮件 team-lead@company.example.com。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-07T09:00:00Z 为时间基准。
