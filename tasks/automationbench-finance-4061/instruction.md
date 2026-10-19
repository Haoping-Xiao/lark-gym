处理本周 QuickBooks 供应商账单付款，支付未来七天内到期且已批准的账单，遵循付款处理指南。告知各供应商付款正在发送，并在 accounts-payable 群发布付款批次摘要，包含相关来源金额。本适配仅登记模拟账务，未向银行发起付款。quickbooks_bill_payments 字段为 bill_number、vendor_name、amount、date；供应商和账单分别适配为 quickbooks_vendors（display_name、email）与 quickbooks_bills（doc_number、vendor_name、total_amt、balance），账单金额字段为字符串。引用来源值时原样保留，不改写或取整。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-10T09:00:00Z 为时间基准。
