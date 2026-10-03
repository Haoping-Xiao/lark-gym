今天是2026-02-15，按当前 Bank Reconciliation Policy 和授权更新核对银行Statement与xero_bank_transactions台账，以reference及收支方向匹配，应用本月金额容差与已确认存款更正。只更新Statement的Status；不改原金额、源Xero交易、已Reconciled及pending reversal项。将未匹配项设Investigate并邮件controller@company.example.com，包含Reference、原金额、未匹配原因。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-15T10:00:00Z 为时间基准。
