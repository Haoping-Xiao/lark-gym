今天是 2026-01-27。依据当前交接流程，为请假成员处理 ss_handoff/ws_campaigns 的相关活动，查询 ws_backup 并逐活动给备份人员发飞书邮件，首行保留要求的主题和追踪码。每项活动创建真实飞书文档，标题为活动名，父目录为 ops；正文先写 campaign: <活动名> 和 recipient: <收件人>，再附完整交接正文；发送后按 SOP 更新 notes。保留业务状态、下一行动和关键联系人，不把同事个人邮箱当作公司归档。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-01-27T12:00:00Z 为时间基准。

飞书文档使用 docs +create / +fetch / +update，指定 --doc-format markdown；文档标题和正文存于真实 Docs 对象，不以 Base 记录替代。
