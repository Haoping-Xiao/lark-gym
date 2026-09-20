处理freshdesk status=2且精确new-customer票，按requester邮箱连接playbook tiers，未知走default。缺default CSM补定共享onboarding@company.example.com，不猜个人；未知客户也做默认介绍。Enterprise kickoff缺日期补Feb10 10–11UTC/cal_onboarding，客户与CSM实际attendee；technical setup/data migration/training各freshdesk_tickets(subject=<公司> - <步骤英文>/requester_email/status=2/priority=2/parent_ticket_id)。Growth仅setup guide票及客户CSM introduction，Starter/default仅客户intro；各CSM另IM通知客户姓名/email/tier和安排。每票新增freshdesk_notes(ticket_id/private=true文本/body含onboarding/company/tier)，逐step追加log，Status分别Scheduled/Ticket Created/Introduction Sent，表示已安排非已完成实施。群只发一条含每个已启动客户公司名。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

日程使用飞书 calendar 命令，日历 ID：cal_onboarding。使用来源明确时区；未标时区按 UTC。

飞书电子表格目录：

- ss_playbook：Onboarding Playbook；工作表 ws_onboarding_steps（Onboarding Steps）, ws_customer_tiers（Customer Tiers）, ws_onboarding_log（Onboarding Log）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-09T09:00:00Z。
