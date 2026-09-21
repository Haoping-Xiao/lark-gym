处理open、feature-request且没有feature-logged的会话，按ws_blocklist完整公司名或邮箱domain排除竞争者，不回复/记录/报告排除项。按ws_areas关键词匹配title+正文，多类命中按行顺序。每条记录ws_log并追加feature-logged，创建intercom_replies(conversation_id/author_type=admin/body感谢并含feature与Product Area)。上游未明示story门槛，采用公开约定：本轮同area至少2条有效请求才汇成一条issues(project=PROD/issuetype=Story/summary含area/description完整列每请求ID/title/正文/request_count数字)，单条仅记录回复。product-feedback报告Batch_Reference、有效请求数、story数和请求人/title/area。

# 操作环境

使用本环境的 Mock 版 lark-cli。业务资料按实体分别存入飞书多维表格，表目录见下方。记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_features：Feature Pipeline；工作表 ws_areas（Product Area Rules）, ws_log（Feature Log）, ws_blocklist（Competitor Blocklist）, ws_config（Report Config）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-24T09:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_f838e95de93a：intercom_companies（来源实体 intercom_companies）
- tbl_340d8a319d78：intercom_contacts（来源实体 intercom_contacts）
- tbl_466e562074c2：intercom_conversations（来源实体 intercom_conversations）
- tbl_fafef0ae098e：intercom_replies（来源实体 intercom_replies）
- tbl_02e3fe5aad80：研发问题（来源实体 issues）
