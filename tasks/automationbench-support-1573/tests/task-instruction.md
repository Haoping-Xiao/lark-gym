根据 HelpScout reply 数、thread 长度及客户是否针对类似问题反复新开会话计算 effort score，登记 ss_effort/ws_scores，为 high-effort 客户加标签并邮件关怀，向 cx-insights 汇总含 ws_config 的 Report_Reference。使用 HelpScout 资料，Gmail 适配为飞书邮箱。 原题没有量化模型，本适配的 effort 等级口径为：同问题重复求助且至少一次会话有 5 条线程，或反复转交，记 HIGH；其他同问题跨会话求助记 MEDIUM；其余 LOW。high-effort 标签标记 HIGH 客户的长线程或转交会话。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
