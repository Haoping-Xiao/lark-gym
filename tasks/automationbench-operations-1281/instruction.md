读完整support来信及所有Escalation Rules/内部incident/suspension邮件。本例无回复历史，明确候选为当前未读且subject含urgent或critical的外部来信；Reviewed计候选数（含随后排除的测试/已解决/停用），qualified计可建单数；选择最近一条有效升级。HubSpot改tickets(subject=原subject/priority=HIGH/description/external_id=ticket:<源message_id>)，描述含客户邮箱、损失及active bridge；业务external_id作为回执单号，不冒充随机record_id。support-escalations通知Urgent ticket created、主题邮箱、Reviewed N/qualified N及损失；私聊客户确认received和escalated并附业务单号。按政策，synthetic另私聊engineering@company.example.com，suspended另私聊billing@company.example.com转交原主题、邮箱和原因（这两地址是本适配补定的内部路由），不另建ticket、不向已解决者发送升级确认。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

HubSpot 集合对应 hubspot_ 加原集合名，记录 ID 为 rec_hubspot_ 加原 ID；properties 内属性展开为同名台账字段。

飞书电子表格目录：

- ss_escalation_config：Escalation Configuration；工作表 ws_escalation_rules（Escalation Rules）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-01-29T19:00:00Z。
