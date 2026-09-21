按ss_enrichment全部规则将zoho_desk_tickets和zoho_desk_contacts以完整email匹配CRM contacts/accounts。Account Type严格完整匹配，不能把Customer - Enterprise/Customer - Prospect/Customer - SMB当Customer；skip与churning review先执行，Strategic明确名单覆盖普通type匹配。每个非跳过票写zoho_desk_comments(ticket_id/content)，有账户写CRM Account及原account_name/account_type，未找到contact写No CRM account found，contact无account写no account linked。不覆写历史comments。按政策创建tasks(subject/原account_id/contact_id/ticket_id/priority=High/status=Not Started)或opportunities(name=原subject/account_id/contact_id/ticket_id/stage=Prospecting)，不猜金额；未匹配任何规则的已知账户仅备注。

# 操作环境

使用本环境的 Mock 版 lark-cli。业务资料按实体分别存入飞书多维表格，表目录见下方。记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_enrichment：Enrichment Policy；工作表 ws_rules（Action Rules）, ws_skip（Skip Statuses）, ws_overrides（Override Rules）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-24T09:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_bc62a3c14fec：客户公司（来源实体 accounts）
- tbl_aa5af4084f37：联系人（来源实体 contacts）
- tbl_9be34f3e549c：商机（来源实体 opportunities）
- tbl_085154084c74：工作事项（来源实体 tasks）
- tbl_0bcae886f817：zoho_desk_comments（来源实体 zoho_desk_comments）
- tbl_8d0d5ae16ba6：zoho_desk_contacts（来源实体 zoho_desk_contacts）
- tbl_13c706bfa9d5：zoho_desk_tickets（来源实体 zoho_desk_tickets）
