时间窗口明确为Jan29 00:00至Jan30 00:00 UTC（完整最近24小时），检查未读subject含Feedback的外部邮件，排除已有PROCESSED标签。由agent分析情绪，读取全部routing/override；正文最新resolved覆盖原负面，seasonal规则查域名及正文，neutral不发群。向所需群分别发原sender及保留事实的摘要（关键词沿用原文，quality下降用decline、账务用billing），不直接回复客户。全部符合处理范围的邮件，包括hold/neutral/resolved，在飞书邮箱中将这些邮件标为已读，保留其他标签，不额外加PROCESSED。先完成所有路由消息再标已读。

来信从飞书邮箱读取；来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-01-30T00:00:00Z 为时间基准。
