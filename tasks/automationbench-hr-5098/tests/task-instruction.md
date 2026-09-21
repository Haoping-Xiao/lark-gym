依据Office Hours规则与最新org消息设置经理预约资料。Calendly改为office_hours飞书台账，每经理一条name=[Manager Name] - Office Hours、manager_email、departments（JSON数组文本）、duration_minutes=30、frequency=weekly、booking_ref=lark-gym://office-hours/manager_email。该引用仅指向模拟预约资料，不伪造可用Calendly URL或具体时段。本题将all other assignments unchanged解释为Priya兼任原Product与新增Engineering。团队别名有来源时发私聊含经理、新部门、30 minutes和引用；新Platform未提供team alias，交David转发，不能捏造地址。变更角色经理由本人cancel旧Office Hours，私聊请求，不修改源Calendly数据。

# 操作环境

使用本环境的 Mock 版 lark-cli。业务资料按实体分别存入飞书多维表格，表目录见下方。记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_managers：Department Managers；工作表 ws_mgrs（Current Managers）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-04-07T09:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_16ebec160999：calendly_event_types（来源实体 calendly_event_types）
- tbl_281832285f98：成员资料（来源实体 lookup_users）
- tbl_010a82c21500：office_hours（来源实体 office_hours）
