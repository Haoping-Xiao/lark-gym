今天是 2026-01-15。按照邮件处理政策和最新 VIP 定义处理未读来信。当前状态在 mail_messages 飞书台账，原始来信群保留快照；成功处理要同步 is_read（字符串 true/false）与 label_ids JSON 数组，保留其他标签。在 mail_labels 创建政策要求的标签（id 与 name 均使用标签名）。只处理符合 VIP 条件的邮件，Chief of Staff 职称本身不视为 C-suite 或 VP。按要求向 ops-inbox@company.example.com 发处理总结，明确已处理数量和本轮 VIP 留未读数量。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_email_policy_001：Email Processing Policy；工作表 ws_email_rules_001（Classification Rules）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-01-15T10:00:00Z。
