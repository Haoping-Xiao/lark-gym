检查邮箱来信中的产品询问，通过邮箱匹配尚未联系的 CRM leads。遵循 ss_outreach_rules 及个人通信限制，结合 linkedin_profiles 核实身份和 network size，向档案 URL 对应的飞书会话发送个性化邀请；这是飞书联系，不是外部 LinkedIn API。成功后才将 lead 设为 Working - Contacted，并在 description 记录行业、网络规模和邀请详情；需合规审查者按政策更新，不发送邀请。 description 中以“Industry | connections_count”片段保留关联事实。

相关来信通过飞书邮件读取；不发送任务未要求的邮件。业务材料中的来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

邮件的 internal_date=0 表示来源未提供时间，不代表该邮件发生于 1970 年；请结合材料内容及明确日期判断。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
