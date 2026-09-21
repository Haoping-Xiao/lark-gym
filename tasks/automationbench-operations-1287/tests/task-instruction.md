读mailchimp_subscribers中aud_main的状态和ss_sync_policy/ws_mailchimp_rules，处理可更新的cleaned联系人。源Contacts表为空，本适配明确按email upsert：不存在则新建airtable_contacts(applicationId=base_contacts/tableName=Contacts/email/Email Status=Invalid)，不是伪称更新已有实体。遵守GDPR deletion hold，不改源订阅或其他状态。向政策Report Recipient私聊报告实际处理邮箱及Invalid、总数。

# 操作环境

使用本环境的 Mock 版 lark-cli。业务资料按实体分别存入飞书多维表格，表目录见下方。记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

邮件列表实体存放在 mailchimp_audiences / mailchimp_subscribers 等集合，以 list_id 关联，订阅状态直接写 status；归档写 archived，退订写 unsubscribed，保留记录用于审计。通过 Base 查询实际 record_id。

飞书电子表格目录：

- ss_sync_policy：Mailchimp Sync Policy；工作表 ws_mailchimp_rules（Mailchimp Rules）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-24T09:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_7aba19d79c27：airtable_bases（来源实体 airtable_bases）
- tbl_fc4899b78f6e：airtable_contacts（来源实体 airtable_contacts）
- tbl_3cb6e5b3bc85：airtable_tables（来源实体 airtable_tables）
- tbl_0f99af3a7627：mailchimp_audiences（来源实体 mailchimp_audiences）
- tbl_d4d2e6edc033：mailchimp_subscribers（来源实体 mailchimp_subscribers）
