按Learning Path Assignment Rules为Active员工按Level登记learning_assignments飞书台账，字段employee_id、employee、path、courses（课程编号JSON数组文本）、status=Assigned，并逐人邮件完整课程计划。不能代员工标记完成，即使逾期；源无prerequisite记录不伪造。Learning Sabbatical仅登记单独learning_deferrals台账employee_id、employee、status=Deferred、reason原Notes，不创建课程assignment或通知。Airtable适配为上述两种台账。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-04-07T09:00:00Z 为时间基准。
