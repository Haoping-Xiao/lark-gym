为 Q1 2026 董事会安排会务：从 ss_board_meetings/ws_upcoming 选择已排期的常规会议，跳过已取消和特殊会议，多项匹配时选最早日期；从 ss_board_members/ws_active 获取需要出席的活跃成员，排除回避者。创建 cal_exec 飞书视频会议 Q1 2026 Board Meeting，当日 09:00 UTC 开始、3 小时、密码保护并邀请成员；将 Board Meeting Consent 向每人发送签署请求。创建 monday_items 台账（board_id=brd_exec、meeting_date、prep_status=In Progress、attendees），在 pg_board 下创建含会议详情、参会人和标准议程的飞书文档，向 executive 通知日期、人数和议程链接。DocuSign 适配为 signature_requests（template_id、template_name、signer_email、status=Sent）及原生邮件请求，不代表实际签署。引用来源值时原样保留，不改写或取整。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-01T09:00:00Z 为时间基准。

文档必须通过飞书 Docs 创建，使用 Markdown 内容；不在 Base 表里登记页面来替代文档。本题将原目录映射为飞书云盘目录 pg_board。 可用 docs +create / +fetch / +update，均指定 --doc-format markdown；云盘目录使用 drive files list 查询。
