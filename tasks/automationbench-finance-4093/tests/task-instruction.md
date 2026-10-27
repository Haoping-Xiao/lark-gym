清理 QuickBooks 中的未存款项，按存款日期对待处理付款分组并创建银行存款，遵循存款程序，向 controller@company.example.com 发送包含相关来源金额的摘要。本适配只做存款登记，quickbooks_payments 使用 deposited 字符串布尔值；quickbooks_deposits 字段为 payment_method、deposit_date、payment_ids（JSON 数组）、amount、memo。摘要区分逐笔来源金额、分组合计和 Grand total。引用来源值时原样保留，不改写或取整。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-12T09:00:00Z 为时间基准。
