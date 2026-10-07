查看 ss_space/ws_rooms 的空间利用率，筛选 Office 类型且日均利用率低于 40% 的办公室，排除会议室、Renovation 及政策/最新通知排除的场所。将合并建议保存为真实飞书文档，标题为 Space Consolidation Report - Q1 2026，父目录为 sp_facilities，正文列房间、容量、入住率及 consolidate 建议。另向设施总监 rachel.torres@company.example.com 邮件结果，包含总空置座位数（各候选房间 capacity × (1 - occupancy%) 之和），保留两位小数，不向下取整。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-09T09:00:00Z 为时间基准。

飞书文档使用 docs +create / +fetch / +update，指定 --doc-format markdown；文档标题和正文存于真实 Docs 对象，不以 Base 记录替代。
