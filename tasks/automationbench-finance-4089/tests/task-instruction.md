核实所有活跃供应商是否有有效保险证明，检查到期日并通知保险即将到期的供应商。遵循供应商合规要求；对保险已过期的活跃供应商，按要求将跟踪表 Status 更新为 Non-Compliant。在 vendor-management 群和 compliance@company.example.com 邮箱发布合规报告。飞书适配保留 Payment Hold 字段，可使用 Yes；报告字段为 Vendor、Expiry、Coverage、状态，状态可选 Compliant、Expiring within 30 days、Non-Compliant。引用来源值时原样保留，不改写或取整。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-15T09:00:00Z 为时间基准。
