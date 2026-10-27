将电子表格中的 HR 政策迁入知识库页面，设置 HR-only 访问并在迁移后删除原表数据，妥善处理仍在审查中的政策，并检查政策详情更正。Confluence 页面适配为原生飞书文档，title 使用政策名称，正文包含 version、effective_date、status 和完整 Content；status 可使用 current、draft。ACL 和源数据删除在本适配中通过负责人处理请求表达，不连接真实 Confluence。引用来源值时原样保留，不改写或取整。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-04-07T09:00:00Z 为时间基准。

飞书文档使用 docs +create / +fetch / +update，指定 --doc-format markdown；文档标题和正文存于真实 Docs 对象，不以 Base 记录替代。
