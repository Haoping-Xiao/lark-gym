按 ss_sla/ws_targets、ws_tiers 和当前跟踪政策检查 Hiver 响应 SLA，考虑客户 tier，标记 breach 并适当升级，向 sla-monitoring 报告含 ws_config 的 Report_Reference。源缺当前时刻，本适配固定 2026-02-09 12:00 UTC；Gmail 适配为飞书邮箱，引用来源值及相关金额时原样保留。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-09T12:00:00Z 为时间基准。
