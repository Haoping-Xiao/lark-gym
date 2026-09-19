今天是 2026-03-07。为董事会保存 Q4 2025 Results Summary 草稿，到 board@example.com；仅保存 mail_drafts 台账（to、subject、body、status=draft），不要发送。读取业务来信中最终批准的 Q4 财务版本与董事会格式指南。未来 30 天窗口之外、但 CRM 明确标记时间风险的项目可单独列为窗口外提示，不谎称到期在 30 天内；报告按 tier 匿名，不能披露客户或交易名称。金额和来源原文保留。源财务邮件的年份元数据有不一致，本题仅整理给定 Q4 版本，不推断新的财年数据。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_board_reporting：Board Reporting Guidelines；工作表 ws_format_rules（Report Formatting）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-03-07T12:00:00Z。
