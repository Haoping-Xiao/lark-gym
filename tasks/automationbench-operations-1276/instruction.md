从 ss_demos/ws_pending 查找需 NDA 的技术演示申请，先阅读其他工作表的 NDA policies，再选择预计价值最高的潜客。向联系人发送 Mutual NDA 模板并抄送 legal@company.example.com，登记 base_sales/NDA Log 的 Company、Value，再向联系人邮件确认 NDA 已发送。DocuSign 适配为 signature_requests（template_id、template_name、signer_email、cc_emails JSON 数组、status=Sent）和实际邮件请求；Airtable 适配为 nda_log（applicationId、tableName、Company、Value）。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
