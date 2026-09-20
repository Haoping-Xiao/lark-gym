将飞书客服台账中的新工单同步到 CRM 案例台账。开始处理前并行读取三份配置表：ss_blocklist/ws_orgs、ss_sla/ws_tiers 和 ss_config/ws_config；按配置筛选与分配优先级。按完整邮箱匹配客户联系人，跳过已存在同客户、同主题的案例；仅处理 new 工单，Blocked 域名不能同步。优先采用配置中的规则；其他工单的 normal 优先级对应 Medium。创建 cases 记录，保留工单主题、描述和联系人/客户引用，origin 为 Web、status 为 New。为每个成功同步的工单新增一条 support_comments 内部备注（ticket_id 为原工单 ID、public 为 JSON 文本 false），说明同步 CRM 并包含客户名称。最后向 support-sync 群汇报已创建数量、同步后案例总数、处理的客户与优先级，并包含配置表中的 Batch_Reference；不列举跳过对象。

客服数据位于同一多维表格：support_tickets、support_users、support_organizations、support_groups 分别对应工单、请求人、客户组织、支持组，记录 ID 为 rec_zendesk_ 加原始 ID。现有工单 comments 保留历史；新增备注写 support_comments，不重写历史数组。其他 CRM 引用仍用原始 ID。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_blocklist：Blocklist；工作表 ws_orgs（Blocked Orgs）
- ss_sla：SLA Tiers；工作表 ws_tiers（SLA Tiers）
- ss_config：Sync Config；工作表 ws_config（Config）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-10T09:00:00Z。
