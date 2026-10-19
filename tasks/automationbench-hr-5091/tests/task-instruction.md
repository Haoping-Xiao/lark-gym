根据员工职位和职级分配学习路径，将已经过期的先修要求自动标记为完成，再分配后续课程，并通过邮件发送学习计划。遵循最新资格规则。Airtable 适配为 learning_assignments（employee_id、employee、path、courses、status）及 learning_deferrals（employee_id、employee、status、reason）飞书台账；courses 为课程编号 JSON 数组文本，状态可使用 Assigned、Deferred。引用来源值时原样保留，不改写或取整。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-04-07T09:00:00Z 为时间基准。
