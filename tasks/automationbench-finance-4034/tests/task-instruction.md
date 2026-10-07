核对 Expense Reclassification 的请求与有效 Chart of Accounts。存在且 Active=Yes 的 Expense 类别才可修改 Current Category 并设 Status=Completed；不存在或失效则 Status=Rejected，原类别不动。给 controller@company.example.com 发飞书邮件，逐项 Expense ID | 最终Category | Status | 原Amount，拒绝项注明原因；不要修改科目表。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-05T10:00:00Z 为时间基准。
