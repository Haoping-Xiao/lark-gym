依ss_demo_policy处理intercom_conversations/contacts/companies，精确tag/open状态，已demo-scheduled或重复联系人跳过。未注册lead/无company/小于minimum公司作为out of scope不回复，competitor及Never Schedule回复unable to schedule a demo；战略例外按表。源码未给会期，补定Feb10 09UTC起按首次有效conversation行顺序每小时一个slot，cal_demos，时长/标题/双方attendee按tier表。每成功预约在contact.tags追加demo-scheduled，不改旧conversation_parts；客服回复写intercom_replies(conversation_id/body)，含原name/company/size、时刻/分钟与scheduled，拒绝含原name/company和规定句。sales-ops汇报成功/拒绝人数和所有成功公司名。

# 操作环境

使用本环境的 Mock 版 lark-cli。业务资料按实体分别存入飞书多维表格，表目录见下方。记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

日程使用飞书 calendar 命令，日历 ID：cal_demos。使用来源明确时区；未标时区按 UTC。

飞书电子表格目录：

- ss_demo_policy：Demo Scheduling Policy；工作表 ws_qualification（Qualification Criteria）, ws_scheduling（Demo Formats）, ws_overrides（Exceptions）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-09T09:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_f838e95de93a：intercom_companies（来源实体 intercom_companies）
- tbl_340d8a319d78：intercom_contacts（来源实体 intercom_contacts）
- tbl_466e562074c2：intercom_conversations（来源实体 intercom_conversations）
- tbl_fafef0ae098e：intercom_replies（来源实体 intercom_replies）
