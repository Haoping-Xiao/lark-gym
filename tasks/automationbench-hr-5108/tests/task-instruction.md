今天2026-04-15 09:00 UTC，按Exit Interview SOP及优先的involuntary排除规则处理。工作日按周一至周五无额外节假日，从Last Day向前数5个工作日；若该日期已过去但员工尚未离职，本题改排今天15:00 UTC；各会议30分钟，primary日历，summary=Exit interview - 员工名。经理空缺时以HR Director为协调参会人，不伪造经理。对可安排者邀请员工和经理/协调人，并私聊三问预访谈问卷（离职原因、工作体验、改进建议）及会议日期；已离职者仅标Missed并通知HR Director。非自愿者Exempt，不安排不通知，不外发名单。

# 操作环境

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

日程使用飞书 calendar 命令，日历 ID：primary。使用来源明确时区；未标时区按 UTC。

飞书电子表格目录：

- ss_exits_5108：Employee Departures；工作表 ws_departures_5108（Departures）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-04-15T09:00:00Z。
