处理待办退款请求，逐案按当前退款政策审查，符合条件的在财务系统执行退款并通知客户，包含相关来源金额。飞书适配中未提供请求日期的 Pending 项按当前业务日期收到处理；QuickBooks 退款适配为 quickbooks_refunds 台账，字段为 case、invoice_number、customer_id、customer_name、amount、status，状态可使用 Processed。申请表使用 Status、Refund Amount，Status 可选 Refunded、Credit memo offered；customer_name 可采用申请表 Customer 或匹配客户主档 display_name 的原文。引用来源值时原样保留，不改写或取整。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-12T09:00:00Z 为时间基准。
