今天为 2026-02-09，检查 expiry tracker 中未来 7 天到期的易腐货物，短信通知仓库联系人、向 inventory alerts 群发布并邮件联系人，包含 lot number 和 location。排除已 disposed 或 quarantine 的货物。窗口含今天至第 7 天；短信适配为电话号码 IM，邮件使用原生邮件，群为 inventory-alerts。引用来源值时原样保留，不改写或取整。

来信读取及向邮箱地址发送通知均使用飞书邮件；手机号及员工账号对应的通知使用已提供的飞书私聊，群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-09T09:00:00Z 为时间基准。
