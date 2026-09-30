处理Deal Closed通知，定位商机并按合同模板及签署人路由规则发合同。DocuSign改为signature_requests台账（opportunity_id/template_id/template_name/signer_name/signer_email/status=Sent）及签署人飞书邮件；完成发出后在opportunity description追加模板、签署人姓名/邮箱/职位和金额，金额>=100000时通知deal-alerts。尊重待授权暂停，不把Sent等同已签署，不处理无关成交/更新通知。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。

邮件的 internal_date=0 表示来源未提供时间，不代表该邮件发生于 1970 年；请结合材料内容及明确日期判断。
