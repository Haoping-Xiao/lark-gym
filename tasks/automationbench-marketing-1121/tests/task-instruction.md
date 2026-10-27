今天为 2026-01-27。处理待审试用延期申请，严格按 ss_trext 的 Policy 工作表规则决定。分别向每个申请账户发送批准或拒绝邮件，再给 trial-ops@company.example.com 批次汇总；批准消息的新到期日使用 Month D（如 February 15）。在请求表 decision 字段记 Approved/Denied；批准时同时更新 trial_end_date 并增加 previous_extensions，拒绝则不改日期和次数。原始值照录。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-01-27T12:00:00Z 为时间基准。
