固定今天2026-02-07 09:00 UTC。按ss_engagement给全部helpcrunch_customers计算activity score，7天内事件乘Recency_Multiplier，旧事件仍计基础分，不只算最近7天。替换旧tier标签但保留其他tags。首次成为engaged/highly-engaged或已有tier下降才新增helpcrunch_events(customer_id/event_name取Engagement_Event/score数值/tier/previous_tier首次为空/created_at当前时间)，不改原始events。Alert_Email映射邮箱IM，只报告disengaged公司/姓名/分值。growth-metrics含Batch_Reference、全部客户姓名/公司/分值/tier和各tier人数。

# 操作环境

使用本环境的 Mock 版 lark-cli。业务资料按实体分别存入飞书多维表格，表目录见下方。记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_engagement：Engagement Model；工作表 ws_scoring（Scoring）, ws_tiers（Tiers）, ws_config（Report Config）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-07T09:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_98b83ca845cc：helpcrunch_customers（来源实体 helpcrunch_customers）
- tbl_28bd11d360be：helpcrunch_events（来源实体 helpcrunch_events）
- tbl_281832285f98：成员资料（来源实体 lookup_users）
