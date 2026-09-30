今天是 2026-04-10，处理当日 POS 的 Completed 交易，其他状态不生成收据。按 Tax Rates 的 State 计算 Tax=Subtotal×Rate，关联 quickbooks_customers，在 quickbooks_sales_receipts 飞书台账创建 transaction_id、customer_id、customer_name、state、date、subtotal/tax/total（数值）。向 manager@company.example.com 发飞书邮件，逐行 Transaction ID | Customer | Subtotal | Tax | Total，再汇总 Subtotal、Tax、Grand total、Transaction count；金额使用美元千位逗号和两位小数。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-04-10T18:00:00Z 为时间基准。
