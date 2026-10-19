处理待办托管资金释放，检查是否满足释放条件，按托管管理程序发起拨付，并通知各方释放状态。飞书适配仅登记账务，不实际支付：escrow_disbursements 字段为 escrow_id、amount、depositor、beneficiary、status，来源 Status 可选 Released、Held。通过飞书邮件通知存款方和受益方，关联 Escrow ID、Amount、状态和原因。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-15T09:00:00Z 为时间基准。
