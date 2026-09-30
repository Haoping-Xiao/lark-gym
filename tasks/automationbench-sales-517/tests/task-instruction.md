处理业务来信 msg_deal_request_001 的商机请求，按照当前定价政策计算金额，在正确的顶层母公司下创建商机，而不是子公司。name 使用 [Account Name] - Q1 Enterprise Deal，stage_name 为 Qualification；向该公司职级最高的联系人发送确认邮件，首行为 Deal Request Received，包含公司名、商机名及计算金额。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。

邮件的 internal_date=0 表示来源未提供时间，不代表该邮件发生于 1970 年；请结合材料内容及明确日期判断。
