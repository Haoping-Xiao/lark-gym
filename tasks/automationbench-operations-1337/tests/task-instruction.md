按SLA Config及所有hold政策，仅未解决/未关闭且无Legal hold，0<deadline-now<=Warning Window才预警；deadline等于now归已到期另流程，不通知。每件向Agent Phone会话IM（SMS替代）发ticket ID、subject、agent、原ISO deadline和剩余分钟；同时汇总到配置Escalation Channel及Support Manager Email。不能修改ticket状态或通知已过期者。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-09T14:00:00Z 为时间基准。
