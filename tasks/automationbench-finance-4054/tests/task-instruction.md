按折旧政策计算固定资产月度折旧并登记分录，向 controller@company.example.com 发送各资产月度费用和累计折旧。本适配的月度处理针对刚结束的月份；源表字段为 Accumulated，journal_entries 台账字段为 asset_id、period、debit_account、credit_account、amount。报告字段为 Asset ID、Monthly charge、New accumulated、Total charge。引用相关来源金额时原样保留，不改写或取整。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-01T10:00:00Z 为时间基准。
