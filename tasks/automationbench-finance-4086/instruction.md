按照供应商映射规则，将未分类银行交易匹配到正确费用类别，更新跟踪表并将分类摘要发至 bookkeeper@company.example.com。飞书适配使用 Category 字段，报告包含 Description、Amount、Category 和处理说明。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-10T09:00:00Z 为时间基准。
