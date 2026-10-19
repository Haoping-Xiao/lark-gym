查邮箱近期产品咨询，对 Salesforce 中尚未联系的 lead 发件人按标准 outreach policies 发个性化 LinkedIn 连接请求，提及其咨询、industry、network size，并更新 CRM 表示已外联。LinkedIn 资料使用 linkedin_profiles，连接外联在本适配中通过资料 URL 对应飞书会话发送，CRM 使用 leads。

相关来信通过飞书邮件读取；不发送任务未要求的邮件。业务材料中的来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

邮件的 internal_date=0 表示来源未提供时间，不代表该邮件发生于 1970 年；请结合材料内容及明确日期判断。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
