团队成员即将休假，请按当前交接程序审查 Campaign Assignments（ss_handoff/ws_campaigns）的活跃活动，创建交接文档并向备份负责人发送摘要及流程追踪码。飞书适配创建原生文档，标题为活动名，父目录为 ops，正文包括 campaign、recipient 和交接内容；通知使用邮件。引用来源值时原样保留，不改写或取整。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-01-27T12:00:00Z 为时间基准。

飞书文档使用 docs +create / +fetch / +update，指定 --doc-format markdown；文档标题和正文存于真实 Docs 对象，不以 Base 记录替代。
