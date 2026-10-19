今天是 2026-04-01。为 Active Contracts 的 Active 合同创建四月发票：Base Rate per Seat×Seat Count×(1+CPI Uplift/100)。Suspended/Cancelled 不开票也不通知。在 quickbooks_invoices 飞书台账保存 customer_id、customer_name、period=2026-04、total_amount（数值）、status=Issued；关联现有客户。逐客户发飞书邮件，使用“Client | 2026-04 | Invoice $金额”报告最终数额（千位逗号），不把未上浮的中间值当成发票金额。通知还须包含对应合同的来源基础单价；通知或记录引用来源值时须原样保留，不得改写或舍入。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-04-01T10:00:00Z 为时间基准。
