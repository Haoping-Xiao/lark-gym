筛选值得关注的行业人士：casey_analyst、casey_analytics、sam_growth、jordan_ops、pat_insights、alex_data、alex_dataops、riley_market、drew_cx、morgan_ai、taylor_saas、kelly_martech，并查看 VP Social 的补充名单。查询 twitter_users 飞书台账，要求验证账号、至少 10000 真实粉丝和可信专业人士简介，排除仿冒、机器人、代理代运营、暂停及明确限制账号。将关注关系写入 twitter_follows 台账（user_id、target_user_id、target_username），这是飞书关注名单，不对 Twitter 发起真实关注。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

当前时间固定为 2026-02-24T09:00:00Z。
