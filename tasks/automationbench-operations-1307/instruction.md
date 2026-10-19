按当前 billing policy 处理 HubSpot 中 payment_status=failed 且 payment_retry_count 小于 3 的联系人。lifetime_value 超过 $10000 的 VIP 通知 vip-support 并邮件 success@company.example.com；普通客户发送自动付款更新邮件。每位已处理者 payment_retry_count 加 1，并登记 ss_billing/ws_failures。HubSpot 适配为 contacts 台账，本流程不实际扣款。引用来源值时原样保留，不改写或取整。

来信读取及向邮箱地址发送通知均使用飞书邮件；手机号及员工账号对应的通知使用已提供的飞书私聊，群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
