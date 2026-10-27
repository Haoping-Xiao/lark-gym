将 CSAT responses、agent assignments、roster 关联计算客服表现，标记未达预期者。结果表 Status 使用 flagged 表示需关注者，Average_CSAT 保留一位小数，记录每位 rostered agent；邮件 support ops 每位人员一位小数均分，向 metrics 群发要点，两处包含 ws_config 的 Report_Reference。源缺 survey 日期时按给定报告快照处理；Gmail 适配为飞书邮箱。包含来源相关金额。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
