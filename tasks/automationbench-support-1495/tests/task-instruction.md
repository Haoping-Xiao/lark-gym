固定2025-01-20T12:00Z，按ss_escalation处理status2票，escalation-hold标签或ws_holds禁令优先。年龄严格大于本轮初始group对应Hours Threshold才升一级，不能同轮连升；priority加1封顶4。新增私有freshdesk_notes(ticket_id/body含escalated、目标Tier、年龄/阈值h、新priority/private=true文本)。给对应Manager Email邮箱IM该经理所有升级票，support-escalations汇总数量、subject、目标tier、年龄和priority；不改变非升级票。

# 操作环境

使用本环境的 Mock 版 lark-cli。业务资料按实体分别存入飞书多维表格，表目录见下方。记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_escalation：Escalation Config；工作表 ws_tiers（Tier Config）, ws_holds（Escalation Holds）
  使用 sheets 业务命令读取表格。

当前时间固定为 2025-01-20T12:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_77c87bf8e743：freshdesk_contacts（来源实体 freshdesk_contacts）
- tbl_27c7d448fabc：freshdesk_notes（来源实体 freshdesk_notes）
- tbl_1984cace9e49：freshdesk_tickets（来源实体 freshdesk_tickets）
- tbl_281832285f98：成员资料（来源实体 lookup_users）
