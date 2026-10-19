对 ss_procurement/ws_po、ws_inv、ws_recv 按 PO Number 三方匹配，仅检查 PO Date>=2026-01-01。Qty Received 不等于 Qty Ordered 时标记差异，Notes=Partial - Expected 时免除此数量差异；Invoice Amount 不等于 Qty Ordered × Unit Price 时标记金额差异。每项差异在 Procurement Issues 创建 Monday 项并写详情，向 procurement@supplychainco.com 汇总全部不匹配。Monday 适配为 monday_items（board、name、description）。

来信读取及向邮箱地址发送通知均使用飞书邮件；手机号及员工账号对应的通知使用已提供的飞书私聊，群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
