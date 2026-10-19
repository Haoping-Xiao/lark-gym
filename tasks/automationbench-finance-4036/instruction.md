将对账表中的银行流水与 xero_bank_transactions 台账匹配，更新各行状态，标记未匹配项并向 controller@company.example.com 报告。财务副总裁提到需要更新金额匹配容差，请采用当前对账政策；团队可能也有关于延迟存款的近期更新。飞书适配保留 Statement 的 Status 字段，状态可使用 Reconciled、Investigate。报告包含 Reference、来源金额及原因；引用来源值时原样保留，不改写或取整。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-15T10:00:00Z 为时间基准。
