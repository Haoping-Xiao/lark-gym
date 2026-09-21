通知受影响客户即将到来的维护窗口。读取 ss_maint/ws_schedule，只处理 Scheduled 行；精确匹配客服组织和通知偏好，根据窗口分类向联系人私聊和/或组织群发送通知。emergency 窗口标题含 EMERGENCY，通知紧急联系人且即使正常偏好仅私聊也要通知组织群；组织 notes 中列出的多个普通联系人均通知。若结束时间早于开始时间，则为次日结束，并在私聊中说明跨 midnight。每个成功处理窗口在 cal_primary 创建 Maintenance: <系统名> 日程，行状态改为 Notified。无法匹配的组织不要猜测。最后在 support-ops 汇报处理窗口数、私聊通知数和创建日程数。

组织资料位于 support_organizations 集合，原 Zendesk 组织的 notes、tags 和 domain_names 保留；组织记录 ID 为 rec_zendesk_ 加原始 ID。未标时区统一 UTC。
