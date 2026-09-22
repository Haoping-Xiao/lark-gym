从业务来信的客户案例投稿中选出最佳一项：按 ARR 最大选择，数值并列时选较新投稿。创建 hubspot_tickets 飞书台账记录，subject 为 Case Study Review - [Company]，并保存 company、contact_email、source_message_id、ARR（数值）、status=Open。向投稿正文指定客户联系人发飞书私聊跟进；在 mail_messages 台账将成功处理的原消息标记 is_read=true（字符串）并从 label_ids JSON 数组去掉 UNREAD，保留其他标签。业务来信群保留原始收件快照，当前处理状态以 mail_messages 为准。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
