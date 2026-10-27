处理薪酬跟踪表中待办调薪，按当前薪酬政策更新员工记录，并向员工及经理发送邮件，包含相关来源金额。飞书适配使用 salary_changes 台账，字段为 employee、new_salary、effective_date、status，状态可使用 Scheduled；来源 Status 可使用 Processed、Pending VP Approval，Current Salary 为当前工资字段。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-04-15T09:00:00Z 为时间基准。
