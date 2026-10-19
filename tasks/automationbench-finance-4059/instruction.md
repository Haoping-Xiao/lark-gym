审查账龄应收款中的潜在坏账，应用核销标准并按坏账程序处理符合条件的项目。通知每个已核销账户对应的销售代表，并向 CFO 发送核销报告，包含相关来源金额。飞书适配使用 bad_debt_writeoffs 台账，字段为 invoice_number、customer、amount、date；源表使用 Write-Off Status 字段，可选值为 Written Off。报告字段为 Customer、Invoice #、Amount 和 Total write-off。引用来源值时原样保留，不改写或取整。

来信读取及向邮箱地址发送通知均使用飞书邮件；手机号及员工账号对应的通知使用已提供的飞书私聊，群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-15T09:00:00Z 为时间基准。
