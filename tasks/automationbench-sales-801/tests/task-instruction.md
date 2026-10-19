处理刚收到的改期请求，按 reschedule policy 取消并重新预约，确保无冲突，更新 CRM 并将所请求新时间记录为 12 小时制。原预约使用 calendly_scheduled_events（status、cancellation_reason），新预约使用 primary 飞书日历，CRM 记录用 leads 和 notes（parent_id、title、body）。请求仅写 Thursday 时对应 2026-02-26，未给时区时用 UTC。

相关来信通过飞书邮件读取；不发送任务未要求的邮件。业务材料中的来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
