今天为 2026-01-27。处理 ss_feedback / ws_log 客户反馈，按当前分类路由政策与 cx-team 最新 VoC/NPS 规则分类并通知相应团队，消息保留原反馈文字和分数并报告条目数。NPS 客户分层仅适用于现有客户，售前潜客只走销售流程。将处理决定新增到飞书 CRM 的 voc_decisions，字段 customer、feedback、category、nps_class、routed_to、decision；来源表保持不变。category 使用 Feature/Pricing/Praise/UX/Bug/Retention/Pre-sales/Excluded；nps_class 使用 Promoter/Passive/Detractor，排除项 Not Scored、潜客 Not Applicable。routed_to 列出实际目标邮箱，以逗号加空格分隔，按 product、sales、customer-success 顺序；无目标为空。decision 使用 Routed/Logged/Excluded。QA 来源不生成决定记录，其他按手册保留处理或排除记录。

本次业务处理以 2026-01-27T12:00:00Z 为时间基准。
