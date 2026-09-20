按archive rules从freshdesk迁移到zoho_desk台账。只配置status且created_at age>=min_age_days、无排除tag及未archived者；完整email复用contact，无则first_name/last_name/email/external_id=email:<邮箱>新建。zoho_desk_tickets保留subject/description，status=Closed，priority按表，requester_email/external_id=freshdesk:<源id>/source_created_at/全部source_notes JSON保存。每源追加archived tag和freshdesk_notes(ticket_id/private=true文本/body含migrated to Zoho Desk与新external_id)，不删除原history；log Zoho_Ticket_ID用同业务external_id，Status=Migrated。migration-tracker汇总4类数字（扫描符合数/迁移票/新contact/复用）及已迁移subject/name，不列排除项。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_archive：Archive Config；工作表 ws_archive_rules（Archive Rules）, ws_field_translations（Field Translations）, ws_migration_log（Migration Log）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-07T09:00:00Z。
