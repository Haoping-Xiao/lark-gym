根据 Zoho Desk 工单历史和 ss_accounts/ws_details 构建客户互动时间线、识别模式并评估健康，登记 ws_journey，对需关注账户告警，向 account-insights 汇总。使用 zoho_desk_tickets 和表格，Gmail 适配为飞书邮箱。 原题没有健康判定边界，本适配将取消/离开信号或多项未解决 High 问题记 Critical/Worsening；已解决历史严重问题且近期低风险积极互动记 Healthy/Improving；稳定低风险或新入门样本不足记 Healthy/Stable；持续未解决 Medium 问题记 At Risk。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-09T09:00:00Z 为时间基准。
