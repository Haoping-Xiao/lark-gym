按refund policy处理open且精确refund-approved票，按完整订单号匹配；VIP只按当前客户email非姓名。判定顺序补明：Not Found、超过window Expired、category不符Denied，再fraud/repeat refunder Escalated，最后loyalty免金额或<=阈值Draft，否则Escalated；源refund-approved视已确认服装条件，不猜额外检查。不同ticket分别日志即使同订单。Gmail草稿改mail_drafts(to/ticket_id/subject/body)，Draft只准备确认不实际退款，body须说明未执行退款；升级jira_issues(project=FIN/issuetype=Task/summary含order/ticket_id/description含姓名金额原因)。每处理票写gorgias_replies(ticket_id/sender_type=agent/body含姓名/order/原金额/规定outcome词)，ws_refund_log逐笔追加，不存在order Amount留空。finance-ops汇总各Action计数及已查到金额分组总额；Draft总额与Escalated总额按票计算，不能把两笔同order跨票消重。不改原订单状态。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_refund_policy：Refund Policy；工作表 ws_thresholds（Thresholds）, ws_categories（Categories）, ws_orders（Orders）, ws_refund_log（Refund Log）, ws_overrides（Override Rules）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-01T12:00:00Z。
