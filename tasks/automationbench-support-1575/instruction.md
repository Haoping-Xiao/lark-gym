处理handoff-requested，先尊重ws_holds全部冻结。按ws_routing匹配有效tag移动mailbox，保留tags；已在目标只记already内部备注不做转移。不匹配任何路由者按_unmatched配置向Escalation Email发邮箱IM，含subject/会话ID/客户邮箱，并在原会话按Reply Template回复询问信息、记escalated内部备注。备注/回复分别追加help_notes/help_replies(conversation_id/body/thread_type=note或reply)，不覆盖历史。每个实际处理会话独立发support-handoffs通知含ID/原subject/结果；冻结者不通知。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
