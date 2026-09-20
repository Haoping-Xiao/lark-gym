检查Facility Incidents各policy，选无hold且Open中Severity数字最小的一件，同severity选Reported最早。查今天Monday on-call，用其电话号码会话IM代替SMS，原名字不能区分班次。创建jira_issues(project由Facilities Ops查/summary=原Summary/issuetype=Incident/reference=Incident ID/severity=源数值文本/description含reported)，并通知facilities-incidents群（源所称incidents channel），两通知含ID、summary、severity、reported及on-call姓名。不报其他事项、不修改源状态。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_incidents：Facility Incidents；工作表 ws_open（Incidents）, ws_incident_hold_policy（Incident Escalation Policy）, ws_oncall（On-Call Schedule）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-09T09:00:00Z。
