按ss_health规则逐Zoho account评分，Open计open、全部priority High计high、Closed/全部票为resolution_rate，无票率为0；分数不封顶，dashboard两位小数字符串，判断Healthy/Unhealthy用未舍入分数与严格低于阈值。ws_new_accounts只豁免SF flag，不改变分数/状态或排除dashboard。非新账户且Unhealthy才创建tasks(subject=unhealthy account: 公司/priority=High/status=Not Started/source_account_id/description含Batch_Reference与score/open/high/closed/total)。源SF account为空，引用源ID不虚构CRM实体，不发送额外通知。

# 操作环境

使用本环境的 Mock 版 lark-cli。业务资料按实体分别存入飞书多维表格，表目录见下方。记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_health：Account Health；工作表 ws_rules（Scoring Rules）, ws_new_accounts（New Accounts）, ws_dashboard（Health Dashboard）, ws_config（Report Config）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-15T09:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_085154084c74：工作事项（来源实体 tasks）
- tbl_c05487963269：zoho_desk_accounts（来源实体 zoho_desk_accounts）
- tbl_8d0d5ae16ba6：zoho_desk_contacts（来源实体 zoho_desk_contacts）
- tbl_13c706bfa9d5：zoho_desk_tickets（来源实体 zoho_desk_tickets）
