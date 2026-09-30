按SKU精确匹配Reference Catalog，只填Products空白Weight (kg)，有值即使与参考不一致也不动；参考缺SKU不猜。修改后创建notion_pages(database_id由Ops Reports查询/title=Inventory Weight Updates/content逐项SKU、旧值blank、新kg)，邮件Contacts指定Inventory Manager报告实际更新，不把未更新SKU列进报告。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
