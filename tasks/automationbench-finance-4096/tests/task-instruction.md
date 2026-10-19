执行每日现金归集，检查账户余额并按资金管理政策划转超额资金，将报告发送至 treasury@company.example.com 和 treasury 群。另外，将货币市场账户超过 $400,000 的余额投资到短期债券基金。飞书适配只操作模拟账务，使用余额表及 cash_transfers 台账，字段为 from_account、to_account、amount、date；报告区分划转前后余额和划转额。引用来源值时原样保留，不改写或取整。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-10T16:00:00Z 为时间基准。
