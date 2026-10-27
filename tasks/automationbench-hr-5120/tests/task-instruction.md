跟进新员工待办背景调查结果，根据各候选人的结果和背景调查程序采取下一步行动，更新跟踪表、发送邮件并在 recruiting 群发布进展，包含受影响实体名称。飞书适配使用来源 Result、Status 和 offer_actions 台账，台账字段为 candidate_id、candidate、action、reason，action 可使用 Rescind；不连接真实外部背调系统。

来信读取及向邮箱地址发送通知均使用飞书邮件；手机号及员工账号对应的通知使用已提供的飞书私聊，群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-04-15T09:00:00Z 为时间基准。
