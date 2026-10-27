按最近一次流程与更新后的合规要求处理 ss_unsub / ws_requests 退订请求，记录到 ss_log / ws_log。邮件名单已映射为飞书 mailchimp_subscribers，归档写 status=archived，并向实际处理的联系人邮件确认。请求完成后 processed=Yes，合规日志 action=Archived、date 为今天，lists_removed 按列表 ID 排序，以逗号加空格分隔。来源记录保留，不删除。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-01-28T12:00:00Z 为时间基准。
