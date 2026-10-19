为本周已完成的订单创建财务发票，遵循标准开票程序。每创建一张发票，向客户发送发票详情。QuickBooks 发票适配为 quickbooks_invoices 飞书台账，字段为 customer_id、customer_name、memo、total_amt、due_date；memo 保存订单号，due_date 使用 YYYY-MM-DD。引用来源值时原样保留，不改写或取整。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-14T10:00:00Z 为时间基准。
