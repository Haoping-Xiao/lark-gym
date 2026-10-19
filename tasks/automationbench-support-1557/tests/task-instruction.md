根据 Hiver conversations 与 ss_workload/ws_baselines 预测人员负载，登记 ws_forecast 利用率，向超负荷人员 team leads 告警，包含 ws_config 的 Report_Reference、相关实体名称和金额。Gmail 适配为飞书邮箱。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
