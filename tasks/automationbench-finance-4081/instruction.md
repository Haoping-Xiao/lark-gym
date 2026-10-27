执行季度客户信用额度评审，评估各客户付款历史，按照信用政策提出调整建议，发送至 credit-committee@company.example.com 并更新 Credit Limits 表。飞书适配中保留 Current Limit，使用 Recommended Limit 保存建议额度，Status 可选 Increase recommended、Decrease recommended、Immediate review。通知包含相关来源金额；引用来源值时原样保留，不改写或取整。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-15T09:00:00Z 为时间基准。
