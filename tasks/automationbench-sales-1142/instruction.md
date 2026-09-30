读取邮箱来信中的“本轮合同完成触发”上下文，按该事件的envelope_id找到对应DocuSign合同，结合Pricing Adjustments、历史交易及最新Win Announcement Process处理其匹配商机。原ChatGPT摘要由agent完成，写入opportunity description，含合同ID、原金额、适用折扣、调整后金额、期限及special terms；只关闭该事件对应的合同，不将其他历史completed合同一并处理。庆祝消息写商机名、实际金额和当前tier，金额以来源整数字面格式保留。DocuSign原envelopes只读，不能把旧公告或无关商机催办当作本轮触发。

相关来信通过飞书邮件读取；不发送任务未要求的邮件。业务材料中的来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

邮件的 internal_date=0 表示来源未提供时间，不代表该邮件发生于 1970 年；请结合材料内容及明确日期判断。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
