检查 Influencer Contracts（ss_influencers / ws_contracts），按 Partnerships 的批次要求，向即将到期的 Active 合同联系人邮件发送续约提醒，并把 Reminder_Sent 改为 Yes。即将到期定义为今天起未来 45 个自然日内（含边界），已过期不包括在内。遵守备注限制，来源值照录并包含联系人姓名。邮件抄送改为向同名邮箱会话另发一份邮件副本。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-01-28T10:00:00Z 为时间基准。
