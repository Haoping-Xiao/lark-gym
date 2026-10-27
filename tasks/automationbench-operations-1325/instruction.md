按SKU精确匹配Reference Catalog，只填Products空白Weight (kg)，有值即使与参考不一致也不动；参考缺SKU不猜。修改后创建飞书文档(父目录从云盘中查找Ops Reports/title=Inventory Weight Updates/content逐项SKU、旧值blank、新kg)，邮件Contacts指定Inventory Manager报告实际更新，不把未更新SKU列进报告。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。

文档必须通过飞书 Docs 创建，使用 Markdown 内容；不在 Base 表里登记页面来替代文档。本题将原目录映射为飞书云盘目录 db_ops_reports。 可用 docs +create / +fetch / +update，均指定 --doc-format markdown；云盘目录使用 drive files list 查询。
