根据价格表中的新定价更新产品目录，应用新价格并归档已停产产品，向 operations@company.example.com 确认变更。Wave 产品目录适配为 wave_products 飞书台账：unit_price 使用不带美元符号的数字字符串，is_archived 使用字符串布尔值，归档通过该字段表达。通知列出 Product、unit_price 和处理状态。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-01T10:00:00Z 为时间基准。
