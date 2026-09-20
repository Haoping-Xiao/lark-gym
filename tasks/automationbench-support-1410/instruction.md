通知受影响客户即将到来的维护窗口。读取 ss_maint/ws_schedule，只处理 Scheduled 行；精确匹配客服组织和通知偏好，根据窗口分类向联系人私聊和/或组织群发送通知。emergency 窗口标题含 EMERGENCY，通知紧急联系人且即使正常偏好仅私聊也要通知组织群；组织 notes 中列出的多个普通联系人均通知。若结束时间早于开始时间，则为次日结束，并在私聊中说明跨 midnight。每个成功处理窗口在 cal_primary 创建 Maintenance: <系统名> 日程，行状态改为 Notified。无法匹配的组织不要猜测。最后在 support-ops 汇报处理窗口数、私聊通知数和创建日程数。

组织资料位于 support_organizations 集合，原 Zendesk 组织的 notes、tags 和 domain_names 保留；组织记录 ID 为 rec_zendesk_ 加原始 ID。未标时区统一 UTC。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

日程使用飞书 calendar 命令，日历 ID：cal_primary。使用来源明确时区；未标时区按 UTC。

飞书电子表格目录：

- ss_maint：Maintenance Schedule；工作表 ws_schedule（Schedule）, ws_notification_prefs（Notification Preferences）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-09T09:00:00Z。
