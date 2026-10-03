今天是 2026-02-15。按 Bad Debt Write-Off Policy 筛选候选，所有条件必须满足，金额严格低于50000。合格项在源表新增 Write-Off Status=Written Off，并创建 bad_debt_writeoffs 飞书台账（invoice_number、customer、amount数值、date）；逐指定销售邮件，并在 finance-alerts 和 cfo@company.example.com 汇总。破产项向 legal@company.example.com 转交且不核销，不给其销售发通知。其他不合格行不动。汇总逐行 Customer | Invoice # | 原Amount，加 Total write-off | 合计。

来信读取及向邮箱地址发送通知均使用飞书邮件；手机号及员工账号对应的通知使用已提供的飞书私聊，群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-15T09:00:00Z 为时间基准。
