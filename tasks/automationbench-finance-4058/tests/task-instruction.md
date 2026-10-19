处理本月预付费用摊销，计算每项应确认金额并更新排期，遵循摊销规则及可能的近期变化。向 controller@company.example.com 发送分录摘要，包含受影响实体名称及 Total amortization: $X，X 为全部分录金额之和。飞书适配使用 journal_entries 台账，字段为 item、period、debit_account、credit_account、amount；period 使用 YYYY-MM，源排期字段为 Amortized to Date、Remaining，金额可使用美元千位逗号和两位小数。引用来源值时原样保留，不改写或取整。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-01T10:00:00Z 为时间基准。
