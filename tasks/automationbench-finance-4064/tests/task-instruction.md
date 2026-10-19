执行季度库存估值，将实盘数量与系统记录比较，计算所需调整，遵循库存调整程序，向 warehouse-mgr@company.example.com 和 controller@company.example.com 发送差异报告。飞书适配使用 System Qty、Physical Qty、Adjustment Status，状态可选 investigation、Auto-adjusted。报告字段为 SKU、Item、System Qty、Physical Qty、Variance、Dollar impact 和处理结果；金额可保留两位小数。引用相关来源金额时原样保留，不改写或取整。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-01-31T14:00:00Z 为时间基准。
