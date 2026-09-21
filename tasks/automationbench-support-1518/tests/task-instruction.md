检查open、defect标签Gorgias票，通过完整产品名匹配ss_defects/ws_catalog，Notes的RECALLED/HOLD优先于active，未知产品和非defect不处理。停产/召回/hold仅gorgias_replies(ticket_id/sender_type=agent/body解释discontinued/recalled/hold)，无tracking承诺、无log/bug。允许产品按现有known和本轮相同产品+同故障去重，新问题每组一条issues(project=QA/issuetype=Bug/summary含产品故障/description完整保留各来源正文/external_key)。新external_key公开规则QA-最早来源ticketID，既有用原Jira Key，关联是业务编号不猜Base recordID。成功票各写ws_log，Status=Known: key或Filed: key，并回复product/defect/tracking key；原消息和tags不变。

# 操作环境

使用本环境的 Mock 版 lark-cli。业务资料按实体分别存入飞书多维表格，表目录见下方。记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_defects：Defect Tracking；工作表 ws_catalog（Product Catalog）, ws_known（Known Defects）, ws_log（Defect Log）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-24T09:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_45f2a400f1c1：gorgias_replies（来源实体 gorgias_replies）
- tbl_47cb447a172a：gorgias_tickets（来源实体 gorgias_tickets）
- tbl_02e3fe5aad80：研发问题（来源实体 issues）
