处理四月 Received Items：Received=Ordered 时按全量建账单并把对应 xero_purchase_orders.status 设 BILLED；少收按实收建账单且 PO 状态保持，向采购说明 shortfall；多收不建账单，向采购说明 overage。必须精确匹配供应商名。xero_bills 飞书台账保存 purchase_order_number、contact_id、contact_name、quantity、unit_price、total（后三者数值）。通过飞书邮件给 procurement@company.example.com 仅发异常项，一行 PO # | Vendor | shortfall/overage N units。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-04-10T10:00:00Z 为时间基准。
