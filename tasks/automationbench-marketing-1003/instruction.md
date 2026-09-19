今天是 2026-01-27 16:00 UTC。检查近期社媒提及并按最新互动 SOP 处理。原社媒资料在 twitter_users / twitter_tweets 飞书台账；点赞用 twitter_likes（user_id、tweet_id）记录并递增对应帖子 like_count；回复用 twitter_tweets 新记录（author_id、in_reply_to_tweet_id、text），投诉升级走 support-alerts 飞书群。当前账户见 twitter_identity。回复须回应具体问题，未知产品能力应先核实，不能虚构支持承诺。这里只管理模拟社媒业务记录。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

当前时间固定为 2026-01-27T16:00:00Z。
