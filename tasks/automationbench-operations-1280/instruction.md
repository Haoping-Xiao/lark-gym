按Departments全部Review Policies/Q1 Eligibility及最新HR/COO邮件，评估2026年度评审资格，选有效headcount最多者、同分最早Review Start。DocuSign改signature_requests(template_id/template_name/signer_email/status=Sent)并私聊dept head签署请求。原缺会议时刻，明确Review Start当日10UTC2小时cal_hr飞书视频日历<Department> Review Calibration并邀请head；Monday原缺board明确brd_hr_reviews，创建monday_items(board_id/item_name=<Department> 2026 Review Cycle)；Confluence原只有HR无ID，使用业务space=HR的confluence_pages(space/title=2026 Review Cycle: <Department>/body)。页面及部门群含annual review、当前headcount、N eligible department总数及UTC会议安排；headcount更新不自动解除EXEMPT。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

日程使用飞书 calendar 命令，日历 ID：cal_hr。使用来源明确时区；未标时区按 UTC。

飞书电子表格目录：

- ss_depts：Departments；工作表 ws_reviews（Reviews）, ws_review_policies（Review Policies）, ws_review_policies_q1（Q1 2026 Review Policy Updates）, ws_review_eligibility_q1（Q1 2026 Review Eligibility Criteria）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-14T11:00:00Z。
