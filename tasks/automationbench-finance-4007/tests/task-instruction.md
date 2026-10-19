员工在 expense-submissions 群提交了报销凭据。逐条读取，按费用政策处理并登记到 Expense Tracker/Submissions，在原群回复登记确认或拒绝原因。飞书适配字段为 Amount、Category、Date、Description、source_message_id；Amount 使用不带美元符号的两位小数字符串，回复正文保留 source_message_id 以关联原请求。引用来源值时原样保留，不改写或取整。

本次业务处理以 2026-02-05T14:00:00Z 为时间基准。
