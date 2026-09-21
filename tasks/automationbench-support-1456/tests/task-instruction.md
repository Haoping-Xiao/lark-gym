按ws_goals roster邮箱关联hiver assignee_id，统计全部状态作为conversations，closed作分子，close rate百分比向下截断整数。达到min_conversations与个人goal且close rate达标、并达到Recognition_Threshold才recognized；任一基准或个人goal不足为coaching。每roster结果行写数字文本和带%截断率、Status recognized/coaching；每standout邮箱IM表扬name/计数/率；每需辅导者单独mail_drafts(to=manager/subject/body/agent_email)，不发manager消息。support-team带tracking code和performance leaderboard，按closed数降序、同分name排序，列每人数字与状态、benchmark。

# 操作环境

使用本环境的 Mock 版 lark-cli。业务资料按实体分别存入飞书多维表格，表目录见下方。记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_performance：Performance Data；工作表 ws_benchmarks（Benchmarks）, ws_goals（Goals）, ws_results_log（Results Log）, ws_config（Config）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-24T09:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_d133e6701c96：hiver_conversations（来源实体 hiver_conversations）
- tbl_e8730dfe4865：hiver_shared_mailboxes（来源实体 hiver_shared_mailboxes）
- tbl_add0821bb6f3：hiver_users（来源实体 hiver_users）
- tbl_281832285f98：成员资料（来源实体 lookup_users）
- tbl_f9aeb41ef78b：mail_drafts（来源实体 mail_drafts）
