当前2026-01-29 04:00 UTC，核对incident queue、全部政策、monitoring邮件和Current on-call，处理应响应的after-hours P1。SMS改为电话号码会话的飞书私聊，正文保留From: +15550001111作原流程审计，不声称实际发送短信；按政策决定是否升级secondary。创建jira_issues(project由Incident Management查/issuetype=Incident/summary/labels为JSON数组/description)及confluence_pages(cloudId=cloud_ops/space_id=SP_INCIDENTS/type=page/title/body)，并私聊incident-stakeholders；所有告警保留事件名、有效severity、detected原ISO时间和被通知on-call姓名。源Twilio历史保留为只读台账，不把历史噪声当本次发送。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_incident_queue：Incident Queue；工作表 ws_queue（Queue）, ws_incident_policy（Incident Policy）, ws_severity_guidelines（Severity Guidelines）, ws_incident_policy_q1（Q1 2026 Incident Policy Update）
- ss_oncall_schedule：On-Call Schedule；工作表 ws_schedule（Schedule）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-01-29T04:00:00Z。
