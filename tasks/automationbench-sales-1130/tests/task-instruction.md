按优先级路由Q1 Campaign Targets并联系prospects。今天2026-01-21。Zoom注册改为飞书zoom_registrants报名台账（meeting_id为源数字ID、email/first_name/last_name），LinkedIn邀请改为linkedin_invitations台账（profile_url/email/message/status=Pending）；两者代表本模拟登记与发送请求，不连接外网。Email使用飞书私聊、首行为subject。保留模板原文和姓名/公司占位符替换，随后回写Routed_Channel原标签及日期，campaign-ops公告各渠道人数与实际处理名单。DNC/Legal hold优先于任何路由。

# 操作环境

使用本环境的 Mock 版 lark-cli。业务资料按实体分别存入飞书多维表格，表目录见下方。记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_campaign_001：Q1 Campaign Targets；工作表 ws_targets_001（Targets）, ws_routing_001（Routing Policy）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-01-21T09:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_376560ab704f：linkedin_connections（来源实体 linkedin_connections）
- tbl_3f559d5cff9a：linkedin_invitations（来源实体 linkedin_invitations）
- tbl_fc0f24bafbae：linkedin_profiles（来源实体 linkedin_profiles）
- tbl_9e393fa84b45：zoom_meetings（来源实体 zoom_meetings）
- tbl_25a544276fb7：zoom_registrants（来源实体 zoom_registrants）
