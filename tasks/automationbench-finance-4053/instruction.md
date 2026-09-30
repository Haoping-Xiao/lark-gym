依据 Wire Transfer Authorization Policy 处理 Pending 请求，核对金额档审批、国际电汇 CFO 审批和 Verified。审批/验证不足一律 Status=Pending Approval，不实际汇款。合格项创建 wire_transfers 电汇演练记录（request_id、payee、amount 数值、status=Sent），本次为电汇演练，Sent 表示演练登记完成。给每名请求者发飞书邮件通知 Request #、Payee、原Amount、结果及缺项原因；不得声称真实银行已付款。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-10T09:00:00Z 为时间基准。
