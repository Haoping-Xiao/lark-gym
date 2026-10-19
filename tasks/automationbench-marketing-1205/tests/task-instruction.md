检查 ss_ig_cal/ws_queue，发布 2026-01-26 当周、状态为 Ready 且属于 AI Assist Launch 的照片，使用表中的 image URL 和 caption；跳过 Scheduled for Later、Needs Revision 或其他活动的帖子。飞书适配提交 instagram_media 发布队列，字段为 image_url、caption、campaign、week_of、status，status 使用 queued，表示排队而非真实外部发布。

本次业务处理以 2026-01-28T09:00:00Z 为时间基准。
