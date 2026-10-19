审查供应商贷项并应用到相应未付账单，遵循供应商贷项政策及其可能的近期更新。同时根据贷项频次更新 Vendor Info 中的供应商评级：有 2 笔或更多贷项的供应商降为 Review。更新跟踪表并通过飞书邮件确认贷项应用，每封确认包含 Total credits applied: $X。飞书适配使用 credit_applications 台账，字段为 credit_number、bill_number、vendor、amount；Open Credits 使用 Remaining Credit，Open Bills 使用 Remaining Balance，Status 可选 Applied、Needs Verification、Partially Paid。引用来源值时原样保留，不改写或取整。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-12T10:00:00Z 为时间基准。
