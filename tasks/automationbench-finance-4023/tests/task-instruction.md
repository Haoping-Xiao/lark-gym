为年度合同准备收入确认排期，将合同总价在合同期限月数内均摊，计算各合同每月确认收入并写入 Rev Rec Schedule，遵循收入确认政策。向 controller@company.example.com 发送完成的排期及当月确认总额。飞书适配目标为 ss_revrec/ws_schedule，字段为 Contract、Customer、Amount；源合同状态字段可使用 Deferred。计算金额使用千分位表示，例如 12,345，可精确到分；引用来源值时原样保留，不改写或取整。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-01T10:00:00Z 为时间基准。
