处理 ss_docks 的 ws_requests、ws_docks、ws_bookings 中装卸码头预订请求，排期前阅读 dock policies。每个成功预订在 cal_docks 创建 Dock [N] - [Company Name] 日历，使用请求日期时间、2 小时；邮件请求联系人确认或解释拒绝原因，每封确认或拒绝邮件包含成功排期、拒绝、暂缓的总数。源未给时区时使用 UTC。引用来源值时原样保留，不改写或取整。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-09T09:00:00Z 为时间基准。
