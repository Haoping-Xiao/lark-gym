检查 Xero 中已接受的报价，按当前报价转换程序转为发票并通知客户。另外，转换前将金额低于 $10,000 的报价上调 8%，因为之前定价偏低。Xero 发票适配为 xero_invoices 飞书台账，字段为 quote_id、quote_number、contact_id、contact_name、total、due_date、status，状态可使用 AUTHORISED。通知关联客户、报价号、Invoice total 和 Due 日期。引用来源值时原样保留，不改写或取整。

来信读取及向邮箱地址发送通知均使用飞书邮件；手机号及员工账号对应的通知使用已提供的飞书私聊，群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-10T09:00:00Z 为时间基准。
