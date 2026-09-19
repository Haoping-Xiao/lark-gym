为确切的Enterprise Platform机会安排60分钟demo，核对当前安全政策、账户状态和Sales Channel Routing Policy，按金额通知正确群，保留公司/机会名和金额。Zoom改飞书视频日程，日历ID sales@company.example.com为host。原题未给日期，本实验选择冻结时间之后、availability_schedules内第一个可用的60分钟窗口；availability时区按来源America/Los_Angeles。waiting room在此环境明确替换为仅受邀者入会(vc_data.meeting_settings.join_meeting_permission=only_event_attendees)，另设非空password；不声称实现逐人放行。来源无客户邮箱，只创建主持人日程、不虚构客户邀请；通知包含完整日期、当地时区/起止时间、时长、公司、机会名和格式化金额。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

日程使用飞书 calendar 命令，日历 ID：sales@company.example.com。使用来源明确时区；未标时区按 UTC。

飞书电子表格目录：

- ss_channel_routing：Sales Channel Routing Policy；工作表 ws_routing_rules（Demo Notification Routing）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-24T09:00:00Z。
