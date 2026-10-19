处理本月各实体间的公司间划转，共享服务分配见 IC Transfer Schedule。记录每笔划转，并通知接收实体的财务联系人；将欧元划转的汇率调整为 1.05，以符合今日即期汇率。遵循公司间划转程序，注意程序可能有近期更新。每条通知包含 Transfers total: $X，其中 X 为全部已处理划转的总额。飞书适配使用 ic_transfers 台账，字段为 ref、from_entity、to_entity、currency、amount、fx_rate、usd_amount、description；源 Status 可使用 Processed。本次仅做账簿登记。引用来源值时原样保留，不改写或取整。

来信读取及向邮箱地址发送通知均使用飞书邮件；手机号及员工账号对应的通知使用已提供的飞书私聊，群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-01T10:00:00Z 为时间基准。
