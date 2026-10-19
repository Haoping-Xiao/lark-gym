按 ss_satisfaction/ws_weights、ws_thresholds 分析 HelpCrunch 满意度，认可满意客户、升级不满意者，检查 ws_plans 的 enterprise 特殊规则。每次通知和记录包含 ws_config 的 Batch_Reference，并登记分析结果。使用 helpcrunch_customers、events、tasks；源无结果表时使用 satisfaction_results（batch_reference、customer_id、email、company、score、classification、customer_type、analysis_period）。Gmail 适配为飞书邮箱。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
