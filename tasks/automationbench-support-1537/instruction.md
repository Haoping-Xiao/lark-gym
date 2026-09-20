按meta当前2026-02-15及ss_risk/ws_weights，new_account_months为自然月年龄排除，未满该月数的账户不评分/记表/创建task；不从Batch_Reference猜今天。所有票计Ticket Count，priority=High计High Priority Count（含Closed），非Closed计Unresolved。score=总票*ticket_weight+High*severity_weight+未结*unresolved_weight。ws_results各数值写文本，达到threshold才创建tasks(subject按SF_Task_Subject_Format/priority=High/status=Not Started/source_account_id=Zoho ID/description含Batch_Reference、公司、所有分项与score)。SF accounts为空，不伪造CRM ID或创建account，不发额外消息。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_risk：Risk Scoring；工作表 ws_weights（Scoring Weights）, ws_results（Risk Results）, ws_config（Report Config）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-15T09:00:00Z。
