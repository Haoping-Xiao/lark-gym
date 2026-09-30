处理Open Zoho票，以account_id精确匹配ss_vendors/ws_vendors。Active供应商本轮新建zoho_desk_tickets(subject=Vendor Escalation: 原subject/description原文/status=Open/priority和account_id/contact_id沿用/source_ticket_id)，并发Contact Email飞书邮件含原subject/description/供应商名/SLA原小时数。没有时长数据，不臆造SLA已超时；升级针对活动供应商请求。每处理源票追加内部zoho_desk_comments(ticket_id/content含Vendor Name与SLA小时/is_public=false文本)。未匹配者只注not a vendor，不含SLA，不建升级/发通知；Expired整票跳过，不写comment/log。ws_log Account=account_id，Action=Escalated或Not a vendor，非供应商Vendor Email空。

来信读取及向邮箱地址发送通知均使用飞书邮件；手机号及员工账号对应的通知使用已提供的飞书私聊，群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
