执行季度销售税合规检查，审查上一季度全部发票，按客户所在州核对是否应用正确税率，标记差异并向 tax@company.example.com 发送报告。飞书适配使用 wave_invoices、wave_customers；invoice_total 表示含税总额，invoice_tax_total 表示其中税额。报告字段为 Invoice、Customer、State、已收税、应收税、差额，金额可使用两位小数，正差额带 +。引用来源值时原样保留，不改写或取整。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-01-15T09:00:00Z 为时间基准。
