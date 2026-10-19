今天是 2026-01-27。审查广告活动表现和最新投放政策，数据在 ss_ads/ws_campaigns，活动状态在 google_ads_campaigns 台账。按当前规则暂停表现不足的活动（status=PAUSED），向 marketing@company.example.com 发飞书邮件，包含受影响活动名、CTR、原 spend/conversions、暂停总花费、加权 CPA 与追踪码。逐项“campaign_name | CTR | spend | conversions”，CTR 两位小数，总计用“Total Spend | 千位逗号数值”和“Average CPA | 两位小数”。此任务管理飞书广告台账，不操作外部广告平台。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-01-27T10:00:00Z 为时间基准。
