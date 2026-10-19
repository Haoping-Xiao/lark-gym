为近期成交商机编制渠道归因报告，按标准报告要求确定收件人和格式，从 Closed Deals（ss_deals）获取数据并发送。演示环境由运维处理，不属于本任务。飞书适配通过邮件发送，并将全文存为 analytics 目录下的原生飞书文档，标题使用 ATTRIBUTION-JANUARY-2026。引用相关来源金额时原样保留，不改写或取整。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-01-27T10:00:00Z 为时间基准。

飞书文档使用 docs +create / +fetch / +update，指定 --doc-format markdown；文档标题和正文存于真实 Docs 对象，不以 Base 记录替代。
