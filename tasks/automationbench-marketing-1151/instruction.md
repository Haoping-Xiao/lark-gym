今天是 2026-01-27。按照现行报告要求为 ss_deals 近期成交数据生成渠道归因报告，发送飞书邮件，并把报告全文保存为真实飞书文档，父目录 analytics，标题 ATTRIBUTION-JANUARY-2026。遵守规定的收件人、月份和数据质量规则；缺失 touchpoints 的记录不进入可归因收入和数量。渠道整数金额按政策格式四舍五入，总计使用 Total Revenue 和 Qualifying Deals；重复触点案例另用“deal_name | channel | N touchpoints | 归因金额”说明分摊。通知和记录引用来源值时须原样保留，不改写或四舍五入，并在报告中列出相关的来源金额。渠道分摊的计算结果仍按上述整数格式。其他团队负责演示环境，不属于本任务。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-01-27T10:00:00Z 为时间基准。

飞书文档使用 docs +create / +fetch / +update，指定 --doc-format markdown；文档标题和正文存于真实 Docs 对象，不以 Base 记录替代。
