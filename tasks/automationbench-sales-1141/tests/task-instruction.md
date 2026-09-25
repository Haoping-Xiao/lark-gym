按Email Routing Policy处理当前未读来信，agent依据正文（包括讽刺）做原ChatGPT情绪判断；已读不重复。需升级的邮件私聊manager，首行以[ESCALATION]加原subject，保留原sender与全文。标签和已读状态改写mail_messages台账：保留其他label_ids，去掉UNREAD，按政策添加标签ID；数组字段保存JSON文本。处理完成再is_read=true，并在email-routing报processed及各路由数量，不能直接回复客户。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
