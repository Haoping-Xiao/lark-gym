登记本月重复分录，检查重复分录排期，按入账程序在系统中创建记录，向 controller@company.example.com 发送包含相关来源金额的摘要。飞书适配使用 journal_entries（entry、period、debit_account、credit_account、amount、status）和 journal_reversals（entry、due_date、debit_account、credit_account、amount、status），period 使用 YYYY-MM，状态可选 Posted、Scheduled；journal_reversals 表示反转计划。报告字段为 Entry、Debit、Credit、Amount、Total debits、Total credits。引用来源值时原样保留，不改写或取整。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-01T10:00:00Z 为时间基准。
