按ss_migration状态/类别映射，将受支持且未关闭的help_conversations迁入reamaze_conversations；同邮箱contact复用，不重复建。新会话source_id/subject/status/contact_email/category/created_at，完整保留source_threads/source_tags JSON与source_mailbox_id，不丢原始历史。迁好再建help_notes(conversation_id/body含migrated to Re:amaze/public=false)，最后close原会话；原threads/tags不改。migration-status报告migration进度、会话数/新增联系人数量和涉及姓名/subject。这里只迁飞书台账，不接外部系统。

# 操作环境

使用本环境的 Mock 版 lark-cli。业务资料按实体分别存入飞书多维表格，表目录见下方。记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_migration：Migration Playbook；工作表 ws_status_map（Status Map）, ws_category_map（Category Map）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-24T09:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_77b186294697：help_conversations（来源实体 help_conversations）
- tbl_2330fab21dcd：help_customers（来源实体 help_customers）
- tbl_dbf31b996399：help_mailboxes（来源实体 help_mailboxes）
- tbl_bb9ef273955e：help_notes（来源实体 help_notes）
- tbl_281832285f98：成员资料（来源实体 lookup_users）
- tbl_cee5fe5a6dc1：reamaze_contacts（来源实体 reamaze_contacts）
- tbl_029a23ba59d9：reamaze_conversations（来源实体 reamaze_conversations）
