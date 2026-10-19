整理本周通过邮件收到的供应商发票，按上月格式和当前归档规范将元数据登记到 Invoice Registry。向 ap-lead@company.example.com 发送摘要，包含 Invoices filed: N, Total amount: $X。适配中“本周”使用截至当前业务日期的滚动七天；源只提供邮件文本，使用 invoice_archive 台账归档，字段为 invoice_number、file_name、source_message_id、content，content 保存邮件正文。Registry 字段为 Invoice、Vendor、Amount、Date Filed、Invoice #、Drive Link；Drive Link 使用 lark-gym://invoice/InvoiceNumber 引用归档记录。引用来源值时原样保留，不改写或取整。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-10T09:00:00Z 为时间基准。
