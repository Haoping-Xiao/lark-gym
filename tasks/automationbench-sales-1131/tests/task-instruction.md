请按 lead-processing 中的分类计分和路由政策，处理本批带 Inbound 标签的未读询盘。根据来信判断 intent、urgency、budget_signal、company_size 并计算得分，在销售线索台账创建记录，保留联系人签名中的邮箱、姓名、公司、title（缺失留空）、status、score 和四项分类，通知相应频道。每封邮件成功处理后，在飞书邮箱中将这封来信标为已读，保留其他标签。最后在 lead-processing 汇报 processed 总数及 hot、warm、cold 数量。

来信读取及向邮箱地址发送通知均使用飞书邮件；手机号及员工账号对应的通知使用已提供的飞书私聊，群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。

邮件的 internal_date=0 表示来源未提供时间，不代表该邮件发生于 1970 年；请结合材料内容及明确日期判断。
