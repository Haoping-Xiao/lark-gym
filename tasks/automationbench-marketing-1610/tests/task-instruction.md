今天是 2026-01-27。执行 Prism 2.0 发布传播，读取 ss_lnch、业务来信和 prism-launch 群，落实最后修改，按渠道审批有效期筛选并先与群内团队协调本轮执行。合格 Social 提交 facebook_pages_posts 飞书发布队列（page_id、message 为 headline 原文、status=queued），合格 Blog 保存 content_queue（content_id、headline、channel、status=queued），合格 Email 按 notes 指定分发地址发飞书邮件。源数据只有标题，本轮不编造正文。源表状态：入队 Queued、通知发送 Sent、待重审 Needs Re-approval；过期项向 content-team@company.example.com 逐项申请重审。向 launch-ops@company.example.com 汇总每项 content_id、最终 headline、状态。队列不代表外部发布成功。

来信读取及向邮箱地址发送通知均使用飞书邮件；手机号及员工账号对应的通知使用已提供的飞书私聊，群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-01-27T12:00:00Z 为时间基准。
