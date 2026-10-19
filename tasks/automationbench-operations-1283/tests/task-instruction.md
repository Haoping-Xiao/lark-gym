处理最近 24 小时（自 2026-01-29 起）主题含 Feedback 的未读邮件，跳过 PROCESSED 标签及内部 @company.example.com 发件人。由 agent 分析 positive、negative 或 neutral 情绪，查阅 feedback config 中 routing rules 及所有 override 工作表，按规则路由，完成后将处理邮件标为已读。原题今天为 2026-01-29；为明确完整窗口，本适配使用 2026-01-29 00:00 至 2026-01-30 00:00 UTC。原 Slack 路由使用飞书群消息。引用来源值时原样保留，不改写或取整。

来信从飞书邮箱读取；来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-01-30T00:00:00Z 为时间基准。
