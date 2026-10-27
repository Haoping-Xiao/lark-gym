处理 ss_feedback/ws_log 中近期客户反馈，分类并采用当前 VoC 框架判断 NPS，查看 cx-team 最新框架更新，将反馈转交适当团队。飞书适配用 voc_decisions 台账登记 customer、feedback、category、nps_class、routed_to、decision；category 可选 Feature、Pricing、Praise、UX、Bug、Retention、Pre-sales、Excluded，nps_class 可选 Promoter、Passive、Detractor、Not Scored、Not Applicable，decision 可选 Routed、Logged、Excluded。routed_to 保存目标邮箱列表。引用来源值时原样保留，消息包含相关人数或条数。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-01-28T12:00:00Z 为时间基准。
