检查Billing Policy，只处理failed且retry<3的合格contact；VIP为lifetime_value严格>10000。VIP通知vip-support及success@company.example.com，普通客户私聊payment update提醒；所有通知保留姓名、邮箱、lifetime_value和处理后retry。随后contacts.payment_retry_count加1，并ss_billing/ws_failures追加Name/Email/Lifetime Value/Retry Count/Route。这里重试计数是通知流程次数，不实际扣款或声称支付成功；grace informational不阻断，取消/更新付款方式按政策排除。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
