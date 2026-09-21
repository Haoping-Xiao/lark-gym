处理Open Zoho票，以account_id精确匹配ss_vendors/ws_vendors。Active供应商本轮新建zoho_desk_tickets(subject=Vendor Escalation: 原subject/description原文/status=Open/priority和account_id/contact_id沿用/source_ticket_id)，并发Contact Email邮箱IM含原subject/description/供应商名/SLA原小时数。没有时长数据，不臆造SLA已超时；升级针对活动供应商请求。每处理源票追加内部zoho_desk_comments(ticket_id/content含Vendor Name与SLA小时/is_public=false文本)。未匹配者只注not a vendor，不含SLA，不建升级/发通知；Expired整票跳过，不写comment/log。ws_log Account=account_id，Action=Escalated或Not a vendor，非供应商Vendor Email空。

# 操作环境

使用本环境的 Mock 版 lark-cli。业务资料按实体分别存入飞书多维表格，表目录见下方。记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_vendors：Vendor Management；工作表 ws_vendors（Vendor List）, ws_log（Action Log）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-24T09:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_c05487963269：zoho_desk_accounts（来源实体 zoho_desk_accounts）
- tbl_0bcae886f817：zoho_desk_comments（来源实体 zoho_desk_comments）
- tbl_8d0d5ae16ba6：zoho_desk_contacts（来源实体 zoho_desk_contacts）
- tbl_13c706bfa9d5：zoho_desk_tickets（来源实体 zoho_desk_tickets）
