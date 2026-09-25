按ss_escalation_config将intercom会话升级到freshdesk台账。时间冻结Feb13 13UTC，24h admin escalated冷却优先；Blocked/Suspended排除、Never优先，Always仅覆盖state，不覆盖其他限制。精确tag/email，现有联系人复用，新contact写name/email/external_id=email:<邮箱>。每个合格conversation独立freshdesk_tickets(subject=原title/conversation_id/requester_email/status=2/priority/external_id=intercom:<conversation id>)，同subject不同会话不合并。新增intercom_replies(conversation_id/body含escalated、新external_id与priority)，建票后contact.tags追加tier2-escalated，旧parts不改。escalation-log汇总成功数量、subject/name/priority，金额源无不虚构。

本次业务处理以 2026-02-13T13:00:00Z 为时间基准。
