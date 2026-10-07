按ss_handoff处理open且不含Skip_Tag的Hiver会话，Tag Pattern逗号表示全部标签都须命中，不能OR；多规则取最高严重度Critical>High>Medium>Low，同级先行。每候选ws_candidates记录，Status=Notified表示已通知负责人，不伪称接收团队已处理。仅给ws_leads目标负责人飞书邮件，每团队一条汇总Batch_Reference、姓名/subject/priority，不联系客户、不添加未请求的源tags。support-handoffs报告handoff总数及各项团队/priority。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
