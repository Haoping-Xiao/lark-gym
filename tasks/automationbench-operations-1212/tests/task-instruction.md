今天2026-01-31，核对policy updates及processing rules，发布当前批准且未撤销的Visitor Policy。active指当前有效批准版本，不表示未来Effective日期已到；必须标清生效日期，不提前强制执行。文档使用飞书文档，父目录=SP_OPS/title=Visitor Policy Update - 2026/body含Effective及Summary原文。创建后邮件security@company.example.com，首行Visitor Policy Updated，含页面标题、日期和变更。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-01-31T10:00:00Z 为时间基准。

文档必须通过飞书 Docs 创建，使用 Markdown 内容；不在 Base 表里登记页面来替代文档。本题将原目录映射为飞书云盘目录 SP_OPS。 可用 docs +create / +fetch / +update，均指定 --doc-format markdown；云盘目录使用 drive files list 查询。
