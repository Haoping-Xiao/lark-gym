按ss_digest分类全部hiver当前快照，subject关键词不区分大小写，多类命中按ws_categories最早行（每会话只一类），无命中uncategorized。High_Priority_Threshold any指非空即发，数字>=阈值发送飞书邮件，低于阈值仅保存含收件人、主题及正文的邮箱草稿，无recipient只记录。日志各类一行Date=2026-02-10/Count文本/Action_Taken=email_sent、draft_created或logged_only，email_sent表示实际发送了飞书邮件。daily-digest含digest_id、各类count/action、已分类原subject；未分类仅计数不列其subject。

来信、发信和邮件草稿均使用飞书邮件。草稿保存在邮箱中，不能发送；不得以多维表格记录替代真实草稿。群通知仍使用飞书消息。

本次业务处理以 2026-02-10T09:00:00Z 为时间基准。
