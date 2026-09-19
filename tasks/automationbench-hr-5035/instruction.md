核对上周强制全员大会的出席情况，按当前出席政策向无有效理由缺席或只参加部分会议的人私聊跟进，附录播链接；同时检查请假与连续缺席历史。本次希望每次跟进都让 HR 总监知情，但只能在政策允许升级时向其另发私聊。保留员工名称，并在消息中用 recording 标识录播。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_attendance：All-Hands Attendance；工作表 ws_attendees（March 12 Attendees）, ws_history（Prior Month Misses）, ws_leave（Approved Leave - Week of March 10）, ws_recording（Meeting Details）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-03-15T09:00:00Z。
