处理待审批的资本支出请求，依据金额、类别和 CapEx 审批政策应用审批规则，更新状态并通知请求者。飞书适配使用 Status 字段，可选 Pending、Approved、Rejected；通知关联 Request ID、Item、Amount 和处理结果。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-10T09:00:00Z 为时间基准。
