按Three-Way Match Tolerance Policy核对Invoice Batch、Purchase Orders、Receiving Reports，只更新发票表Status。边界按含等号处理；源规则未定义价格差额超过5%的处置，本题补充为Price Variance - Hold，不擅自批准。数量差异优先Quantity Discrepancy - Hold。向ap-lead@company.example.com飞书邮件汇总全部非批准项，列Vendor Invoice、PO #、原发票金额、PO金额、三方数量和状态。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-10T09:00:00Z 为时间基准。
