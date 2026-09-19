今天2026-03-18，本周03-16至03-22。处理本周Pending离职者，源未提供分离类型细则，本批均Voluntary；PTO只按原天数交Payroll审核，不算金额。BambooHR改employee_departures台账employee_id、name、status=Departing、last_day；Jira改offboarding_tickets台账summary姓名、employee_id、action=Revoke access、effective_date=Last Day、status=Scheduled，不提前撤销访问。私聊payroll@company.example.com列全员姓名、Employee ID、Last Day、Type、PTO及本批人数。完成上述登记和通知后来源Status=Processed，仅表示离职准备已处理。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_offboard_full：Offboarding Master；工作表 ws_this_week（Week of March 18）, ws_offboarding_status（Offboarding Processing Convention）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-03-18T09:00:00Z。
