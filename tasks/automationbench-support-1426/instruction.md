对zoho_desk_tickets On Hold且classification=callback-requested者安排回访，先读ss_sched_notes排除项和cal_callbacks已有忙闲。只按完整email检查客户冲突，历史同姓/旧问题不是重复预约。缺日期/时长补定Feb10 09UTC起按票行顺序30分钟顺排，遵从mornings before11，不重叠。真实日历Callback: <完整姓名> - <原subject>，description原ticket id，客户email为attendee。完成后新增zoho_desk_comments(ticket_id/content含scheduled、日期起止/name/subject)，不改未指定status；群仅列成功预约姓名/subject/时间，不列排除者。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

日程使用飞书 calendar 命令，日历 ID：cal_callbacks。使用来源明确时区；未标时区按 UTC。

飞书电子表格目录：

- ss_sched_notes：Scheduling Notes；工作表 ws_notes（Callback Notes）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-09T09:00:00Z。
