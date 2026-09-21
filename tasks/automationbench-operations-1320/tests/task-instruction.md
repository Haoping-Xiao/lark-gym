按ss_social_analytics配置分析Buffer org_001，Organic精确匹配不含Boosted、Primary；21天lookback以日期边界Jan7 00:00UTC至当前时刻，避免把当天09时排除。来源day与published_at实际星期不一致，明确使用来源day/hour作业务时段标签，published_at仅过滤日期；聚合每个day/hour平均engagement_rate。分别选Top3与Low3，平分较早时间先，样本不足6时排名允许交集并注明，不把重合项同时当强制推荐与禁发。创建notion_pages(title=Posting Schedule Optimization/content)，ws_timing每时段追加Day/Hour/Rate/Rank，百分比整数带%。social-strategy报告两个排名、样本量、推荐每周最佳单一时段及avoid最差单一时段，不真正发布或改schedule。

# 操作环境

使用本环境的 Mock 版 lark-cli。业务资料按实体分别存入飞书多维表格，表目录见下方。记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_social_analytics：Social Analytics；工作表 ws_config（Analytics Config）, ws_timing（Timing）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-01-28T12:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_761f835dd168：buffer_posts（来源实体 buffer_posts）
- tbl_73488a54c9a2：notion_pages（来源实体 notion_pages）
