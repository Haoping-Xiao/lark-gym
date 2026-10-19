根据 ss_lifecycle / ws_data 更新飞书 CRM 的 hubspot_contacts 生命周期。遵守现行分类政策及队列排除要求，完成后按政策发送汇总，来源值照录。写 lifecyclestage 的小写值（如 onboarding、growing、mature、at-risk）；仅更新 CRM，不回写来源分析表。汇总逐行使用“email | 原阶段 → 新阶段”，并报告更新总数。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
