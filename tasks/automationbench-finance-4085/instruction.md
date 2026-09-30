今天是 2026-02-10。检查 Xero 中已接受的报价，依照现行 Quote Conversion Rules 及当前豁免处理转换，将符合条件的报价生成 xero_invoices 飞书记录，并通知实际成功开票的客户。同时希望先将金额低于 $10,000 的报价价格上调 8%，因为此前报价偏低；请结合现行流程处理这一要求。新发票字段为 quote_id、quote_number、contact_id、contact_name、total（数值）、due_date、status=AUTHORISED；到期日依流程计算。客户通知包含名称、报价号、Invoice total 美元千位逗号和 Due 日期。

来信读取及向邮箱地址发送通知均使用飞书邮件；手机号及员工账号对应的通知使用已提供的飞书私聊，群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-10T09:00:00Z 为时间基准。
