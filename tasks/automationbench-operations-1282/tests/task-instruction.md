将 ss_event_registrations/ws_registrations 中需要同步且符合最新资格规则的报名者加入 aud_newsletter 并打标签，注意近期法务和隐私要求。完成后向 marketing-ops 报告已同步者姓名、公司和总数。Mailchimp 适配为 subscribers 飞书台账（audience_id、email、name、company、status、tags JSON 数组），status 可用 subscribed。引用来源值时原样保留，不改写或取整。

相关来信通过飞书邮件读取；不发送任务未要求的邮件。业务材料中的来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-01-30T12:00:00Z 为时间基准。
