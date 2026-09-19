按ss_escalation_config将intercom会话升级到freshdesk台账。时间冻结Feb13 13UTC，24h admin escalated冷却优先；Blocked/Suspended排除、Never优先，Always仅覆盖state，不覆盖其他限制。精确tag/email，现有联系人复用，新contact写name/email/external_id=email:<邮箱>。每个合格conversation独立freshdesk_tickets(subject=原title/conversation_id/requester_email/status=2/priority/external_id=intercom:<conversation id>)，同subject不同会话不合并。新增intercom_replies(conversation_id/body含escalated、新external_id与priority)，建票后contact.tags追加tier2-escalated，旧parts不改。escalation-log汇总成功数量、subject/name/priority，金额源无不虚构。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_escalation_config：Escalation Policy；工作表 ws_rules（Escalation Rules）, ws_exclusions（Excluded Companies）, ws_overrides（Override Rules）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-13T13:00:00Z。
