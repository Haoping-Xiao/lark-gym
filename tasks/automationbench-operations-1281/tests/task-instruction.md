检查支持邮箱中主题含 urgent 或 critical 的未回复客户来信，通读正文确认仍需升级，并查阅升级指南及客户账户的内部事故邮件，选择最近的一封。创建 HIGH 优先级工单，主题与邮件一致，描述包含客户邮箱；向 support-escalations 通知 Urgent ticket created: <Subject> from <Customer Email>，向客户确认收到并升级请求，附工单 ID。今天是 2026-01-29。HubSpot 适配为 tickets（subject、priority、description、external_id）；工单业务号可用 ticket:<源message_id>。缺回复历史时以当前未读外部邮件作为候选。引用来源值和相关金额时原样保留，不改写或取整。 本环境内部技术与账务转交邮箱分别为 engineering@company.example.com 和 billing@company.example.com，是否转交按来源指南判断。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-01-29T19:00:00Z 为时间基准。
