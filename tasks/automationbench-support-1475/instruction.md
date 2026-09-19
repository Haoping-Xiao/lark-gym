按signal config检查open intercom会话正文，关键词大小写不敏感子串，每种signal同会话只一次；通过contact company与SF account完整name连接现有非Closed机会，不推断没有的机会。每有效信号创建tasks(subject=配置subject - 公司/priority/status=Not Started/owner_id=机会owner/what_id=机会ID/account_id/conversation_id/description原会话正文)，contact加intercom_notes(contact_id/body含signal/company/conversation)，会话tags追加signal-detected。仅Send_Email=yes给owner邮箱IM，其他不发。revenue-ops含report_id/实际信号数、公司/姓名/signal，排除无机会或无signal者。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_signals：Signal Config；工作表 ws_keywords（Keywords）, ws_actions（Actions）, ws_config（Config）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-24T09:00:00Z。
