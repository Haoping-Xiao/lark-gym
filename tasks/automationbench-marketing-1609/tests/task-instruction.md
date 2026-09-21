分析 ss_analytics/ws_data，找出各平台最佳发布时间并追加到 ss_schedule/ws_optimal，然后通知 social-team 飞书群。本轮只研究普通 LinkedIn、Twitter 帖子，不含直播、Spaces、Newsletter 等独立格式；排除备注指出不可靠、付费、暂停或过时样本的行。每个平台取互动率最高的两个时段，平台内按降序标 rank=1/2；基准为该平台全部有效时段 avg_engagement 的简单平均。engagement_lift 用有符号一位小数与 pp，expected_engagement 保留源比率。 通知逐行复述“platform | rank | day | time_slot | expected_engagement | engagement_lift”。

# 操作环境

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_analytics：Post Analytics；工作表 ws_data（Data）
- ss_schedule：Posting Schedule；工作表 ws_optimal（Optimal Times）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-24T09:00:00Z。
