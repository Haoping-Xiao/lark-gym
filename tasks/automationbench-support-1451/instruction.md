结合 Intercom 会话与 ss_health/ws_usage_data、ws_scoring_model 计算客户健康，加 health 标签，为 at-risk 账户建票并提醒 CSM；公司没有 usage 行时只标 unknown，不推断零分、不纳入分布。向 customer-health 发布分布及 scoring config 的 batch_tracking_code。使用 intercom_contacts、intercom_tickets、intercom_notes；源缺 CSM 地址时用 csm-team@company.example.com，Gmail 适配为飞书邮箱。包含来源相关金额。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
