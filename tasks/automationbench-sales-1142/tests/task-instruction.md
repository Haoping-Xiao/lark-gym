读取业务来信中的“本轮合同完成触发”上下文，按该事件的envelope_id找到对应DocuSign合同，结合Pricing Adjustments、历史交易及最新Win Announcement Process处理其匹配商机。原ChatGPT摘要由agent完成，写入opportunity description，含合同ID、原金额、适用折扣、调整后金额、期限及special terms；只关闭该事件对应的合同，不将其他历史completed合同一并处理。庆祝消息写商机名、实际金额和当前tier，金额以来源整数字面格式保留。DocuSign原envelopes只读，不能把旧公告或无关商机催办当作本轮触发。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
