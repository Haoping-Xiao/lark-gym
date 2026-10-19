列出未读邮件，将行业新闻发送至适当团队：executives@company.example.com、legal@company.example.com、product@company.example.com；发送前遵循批次要求。飞书适配使用原生邮件，允许逐篇或按团队完整汇总。引用来源值时原样保留，并包含受影响实体名称。

原始来信位于 agent@company.example.com 邮箱，来源收件人 me 映射为该账号，未读状态以原始 is_read 字段为准。本题“列出”以 CLI 返回仅含未读邮件的完整清单为完成依据，可以分页检索；须在首次团队发送前完成，不必另发清单邮件。来源中的 Slack 频道对应同名飞书群，批次按其中明确指定的日期判断。

本次业务处理以 2026-01-28T09:00:00Z 为时间基准。
