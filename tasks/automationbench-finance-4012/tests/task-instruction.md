为本周已完成订单创建财务发票，遵守开票 SOP，逐项计算数量、单价和折扣。写入 quickbooks_invoices，包含 customer_id、customer_name、memo（须包含原订单号，可补充准确上下文）、total_amt 和 due_date（YYYY-MM-DD）。创建后通过飞书邮件向每个客户发送发票详情，保留原订单号和金额信息。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-14T10:00:00Z 为时间基准。
