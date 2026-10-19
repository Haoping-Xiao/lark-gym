处理待办电汇请求，逐项对照电汇授权程序核实并处理获批划转，通知请求者结果。飞书适配只做电汇演练，使用 wire_transfers 台账，字段为 request_id、payee、amount、status；Sent 表示演练登记完成，来源请求 Status 也可使用 Pending Approval。通知关联 Request #、Payee、Amount 和结果，不声称实际银行已付款。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-10T09:00:00Z 为时间基准。
