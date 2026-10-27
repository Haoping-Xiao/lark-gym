为 dormant Intercom contacts 执行季度 reactivation campaign，查 ss_reactivation/ws_activity，排除 ws_dnc、ws_recent_outreach、ws_active_subs，按 ws_spend_history 档位分组发送邮件，已发送者加 reactivation-sent 并登记 ws_outreach_log，向 reactivation-campaign 汇总含 ws_config 的 Batch_Reference。使用 intercom_contacts，Gmail 适配为飞书邮箱；原题未给休眠阈值，本适配定义 inactive 且距最后活动超过 90 天。包含来源相关金额。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-01-29T09:00:00Z 为时间基准。
