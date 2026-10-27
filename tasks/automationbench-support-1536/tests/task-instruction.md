查 ss_vendors/ws_vendors 的供应商详情及 SLA，处理相关 Zoho Desk 工单，按需创建 Vendor Escalation: <Source Subject> 并邮件供应商联系人。每个已处理源票加内部备注含匹配供应商名和 SLA hours，无匹配则写 not a vendor；登记 ws_log。使用 zoho_desk_tickets、zoho_desk_comments，Gmail 适配为飞书邮箱，引用来源值时原样保留。

来信读取及向邮箱地址发送通知均使用飞书邮件；手机号及员工账号对应的通知使用已提供的飞书私聊，群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
