按ss_workload/ws_baselines只处理active人员，PTO不进forecast/通知。按assignee_id统计open+pending，closed不计；utilization=100*load/capacity，ws_forecast写文本数值，整数不带小数点，非整数两位小数。严格高于Overload_Threshold才向对应Team Lead Email发飞书邮件，含Report_Reference、overload、姓名、load/capacity/百分比；不直接通知agent，不更改会话分派。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
