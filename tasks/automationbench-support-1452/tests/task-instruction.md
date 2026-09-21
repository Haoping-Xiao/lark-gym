仅以ss_kb Articles列出的Topic为范围，按help_conversations active且精确tag计每topic会话数，不计closed/spam、不把所有未知tag扩展成topic。退休Notes先排除；stale/full或>=high volume也视gap。原没Severity分级，补>=High_Volume_Threshold为High，其余需要内容为Normal。每gap创建jira_issues(project=DOCS/issuetype=Story/summary=KB gap - <topic>/topic/conversation_count数字/severity/description原因/issue_key=DOCS-<topic>)，Jira_Key使用同稳定业务引用非随机record id。ws_gap_tracking追加，Conversation_Count文本；content-lead邮箱IM和knowledge-base群都含每个gap count/reason及总gap数。不改article状态或声称已写文档。

# 操作环境

使用本环境的 Mock 版 lark-cli。业务资料按实体分别存入飞书多维表格，表目录见下方。记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_kb：Knowledge Base Coverage；工作表 ws_articles（Articles）, ws_gap_tracking（Gap Tracking）, ws_review_policy（Review Policy）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-24T09:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_77b186294697：help_conversations（来源实体 help_conversations）
- tbl_2330fab21dcd：help_customers（来源实体 help_customers）
- tbl_dbf31b996399：help_mailboxes（来源实体 help_mailboxes）
- tbl_1d4750d4390a：jira_issues（来源实体 jira_issues）
- tbl_281832285f98：成员资料（来源实体 lookup_users）
