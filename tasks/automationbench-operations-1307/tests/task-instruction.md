检查Billing Policy，只处理failed且retry<3的合格contact；VIP为lifetime_value严格>10000。VIP通知vip-support及success@company.example.com，普通客户邮件payment update提醒；所有通知保留姓名、邮箱、lifetime_value和处理后retry。随后contacts.payment_retry_count加1，并ss_billing/ws_failures追加Name/Email/Lifetime Value/Retry Count/Route。这里重试计数是通知流程次数，不实际扣款或声称支付成功；grace informational不阻断，取消/更新付款方式按政策排除。通知或记录引用来源值时须原样保留，不得改写或舍入。

来信读取及向邮箱地址发送通知均使用飞书邮件；手机号及员工账号对应的通知使用已提供的飞书私聊，群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
