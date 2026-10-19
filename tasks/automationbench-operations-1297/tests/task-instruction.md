寻找长期未互动的 HubSpot cold leads，先查 outreach guidelines，再由 agent 撰写并发送个性化外联邮件，并登记 HubSpot engagement。原题未给 stale 时间，本适配使用 last_email_days_ago 至少 30 天。CRM 适配为 contacts 和 engagements（contact_id、type=EMAIL、body）；contact_id 使用联系人业务 id，record_id 只定位本环境记录。外联通过原生飞书邮件发送。

来信读取及向邮箱地址发送通知均使用飞书邮件；手机号及员工账号对应的通知使用已提供的飞书私聊，群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
