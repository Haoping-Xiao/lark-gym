按P-card所有worksheet政策识别需补receipt的交易，每笔在monday_items创建board_id/name=Transaction ID/cardholder/vendor/amount/date/status=Receipt Requested，并分别向cardholder邮箱对应会话邮件交易ID、Vendor、原Amount、Date及5 business days补交要求。保留金额原始格式，不改源Receipt Status，不处理其他card/status或阈值外交易。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
