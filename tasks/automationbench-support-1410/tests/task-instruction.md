处理 ss_maint/ws_schedule 中 Scheduled 维护窗口，匹配 Zendesk organization，按 ws_notification_prefs 与维护分类通过邮件或群通知。Emergency 窗口邮件主题含 EMERGENCY，通知 Emergency Contact，即使正常偏好 email-only 也发组织群；结束早于开始时邮件说明跨午夜。每窗口创建 Maintenance: <system name> 日历，更新行 Status=Notified，向 support-ops 汇总窗口数、邮件数、日历数。Google Calendar 适配为 cal_primary 飞书日历，Gmail 适配为飞书邮箱，引用来源值时原样保留。

组织资料位于 support_organizations 集合，原 Zendesk 组织的 notes、tags 和 domain_names 保留；未标时区统一 UTC。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-09T09:00:00Z 为时间基准。
