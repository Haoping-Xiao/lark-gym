按migration policy将open gorgias_tickets迁移至freshdesk台账。Legal Hold优先，urgent-migrate只覆盖exclusion不当作urgent priority；tag必须精确。每新客户创建freshdesk_contacts(name/email/external_id=email:<email>)，每票freshdesk_tickets(subject原文/description按messages顺序用换行连接body_text/requester_email/status=2/priority/原tags JSON/external_id=gorgias:<原id>/source_channel)。内部迁移消息新增gorgias_replies(ticket_id/sender_type=agent/public为JSON文本false/body含migrated与新external_id)，不能客户通知或关闭来源。每成功票追加migration log，Freshdesk Status写Open；support-ops仅汇总实际迁移票数及subject。

# 操作环境

使用本环境的 Mock 版 lark-cli。业务资料按实体分别存入飞书多维表格，表目录见下方。记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_migration_policy：Migration Policy；工作表 ws_priority_rules（Priority Rules）, ws_exclusion_tags（Exclusion Tags）, ws_overrides（Override Rules）
- ss_migration：Migration Tracker；工作表 ws_migration（Migration Log）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-24T09:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_77c87bf8e743：freshdesk_contacts（来源实体 freshdesk_contacts）
- tbl_1984cace9e49：freshdesk_tickets（来源实体 freshdesk_tickets）
- tbl_45f2a400f1c1：gorgias_replies（来源实体 gorgias_replies）
- tbl_47cb447a172a：gorgias_tickets（来源实体 gorgias_tickets）
