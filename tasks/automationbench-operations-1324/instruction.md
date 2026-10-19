发票 INV-2026-0452 已付款，检查 ss_invoices/ws_line_items 中零件号以 -EXP 结尾的加急项目，计算其 quantity × unit price 总值。在 brd_shipping 创建 Monday 项目，包含发票号、加急项目数和总值，status=Pending、due=2026-02-11；向 warehouse@company.example.com 邮件列出每个加急零件号、数量和总值。Monday 适配为 monday_items（board_id、name、expedited_item_count、total_expedited_value、status、due）；项目数指行数，区别于数量之和。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
