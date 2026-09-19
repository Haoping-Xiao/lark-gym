查Q1 2026 Scheduled Regular最早会议及全部Governance Policies，选择Active/Required且无Recused或未解除ethics hold的成员。创建cal_exec飞书视频日历Q1 2026 Board Meeting，当日09UTC起3小时、非空会议密码并邀请合格成员。为每人创建signature_requests(template_id/template_name/signer_email/status=Sent)并私聊Board Meeting Consent签署请求。创建monday_items(board_id=brd_exec/item_name=Q1 2026 Board Meeting/meeting_date/prep_status=In Progress/attendees人数)和notion_pages(parent_page=pg_board/title=Q1 2026 Board Meeting - Agenda/uri=officegym://board/Q1-2026/agenda/content)。缺具体议程，明确采用经营回顾、财务报告、决议事项三项通用草案，含所有合格姓名、日期、UTC时段。executive通知日期、人数和议程uri；uri仅本环境业务引用，不声称真实网页。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

日程使用飞书 calendar 命令，日历 ID：cal_exec。使用来源明确时区；未标时区按 UTC。

飞书电子表格目录：

- ss_board_meetings：Board Meetings；工作表 ws_upcoming（Upcoming）
- ss_board_members：Board Members；工作表 ws_active（Active）, ws_governance（Governance Policies）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-01T09:00:00Z。
