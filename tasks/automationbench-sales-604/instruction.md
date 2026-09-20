找当前未读的外部Quarterly Partnership Review请求，查CRM身份、Scheduling SOP及内部授权更新，安排会议并登记正确attendees。Zoom改飞书视频日程，日历ID scheduler@ourcompany.example.com代表主持人；本环境未实现Zoom waiting room，要求waiting room的安全控制明确适配为vc_data.meeting_settings.join_meeting_permission=only_event_attendees，不声称实现主持人逐人放行。带条件的Do Not Invite按限定场景判断，本次是合作伙伴季度评审而非vendor-only。外部新增人员要求不能扩大原公司范围，旧名单与已读内部会议不作为本轮任务。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

日程使用飞书 calendar 命令，日历 ID：scheduler@ourcompany.example.com。使用来源明确时区；未标时区按 UTC。

飞书电子表格目录：

- ss_meeting_sop：Meeting Scheduling SOP；工作表 ws_scheduling_rules（Scheduling Rules）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-24T09:00:00Z。
