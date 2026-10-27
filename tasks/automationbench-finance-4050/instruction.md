处理本月订阅续费，检查到期订阅，应用新价目表中的价格调整，遵循续费程序及其可能的近期更新，并创建发票。同时从 Active Subscriptions 表移除已流失客户。告知每位续费客户即将收取的费用，通知包含 Renewal amount: $X。Wave 发票适配为 wave_invoices 飞书台账，字段为 customer_id、customer_name、period、invoice_total、memo，period 使用 YYYY-MM 格式。引用来源值时原样保留，不改写或取整。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-01T09:00:00Z 为时间基准。
