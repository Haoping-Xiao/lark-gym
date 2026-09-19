检查 February 10, 2026 飞书日历中的会议室预约。标题以 [房间名] 开头，按精确房间名寻找两个定时事件的重叠；全天事件不与定时事件算冲突，类似 Room A 和 Room A1 必须区分。先读 Room Booking Policies 处理失效预约。每个冲突在 office-ops 群说明两个完整会议标题、房间和重叠时间，并汇报冲突总数与总分钟数。向后来创建事件（事件 ID 数字更大者）描述中的组织者发私聊请求 reschedule；不直接修改日程。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

日程使用飞书 calendar 命令，日历 ID：primary。使用来源明确时区；未标时区按 UTC。

飞书电子表格目录：

- ss_room_booking：Room Booking Policies；工作表 ws_booking_policy（Booking Policy）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-09T09:00:00Z。
