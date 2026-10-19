对 Enterprise 账户做季度健康检查，从惯常平台获取信号、评分并更新 Salesforce，标记需关注项，向 account-health 汇总。Zoom 和 LinkedIn 资料适配为只读台账，CRM 使用 accounts、tasks；来源缺 task 活动时间时用其 due_date 作为活动日期。

相关来信通过飞书邮件读取；不发送任务未要求的邮件。业务材料中的来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

邮件的 internal_date=0 表示来源未提供时间，不代表该邮件发生于 1970 年；请结合材料内容及明确日期判断。

本次业务处理以 2026-02-18T12:00:00Z 为时间基准。
