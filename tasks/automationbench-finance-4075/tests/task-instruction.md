将收到的供应商对账单与应付账款记录核对，识别差异，就未解决项目向相应供应商发送邮件，并向 controller@company.example.com 发送对账摘要。飞书适配报告字段为 Vendor、Statement、AP、Difference，差额可使用 Statement-AP 的有符号值。引用相关来源金额时原样保留，不改写或取整。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-10T09:00:00Z 为时间基准。
