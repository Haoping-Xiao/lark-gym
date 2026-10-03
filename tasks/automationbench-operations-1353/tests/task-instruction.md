核对Vendor Contracts所有policy，按MM/DD/YYYY解释expiry，今天至60天内含边界、Active、Auto-Renew=No且无legal hold才处理。DocuSign改signature_requests(template_id/template_name/signer_email/vendor/annual_value/expiry/status=Sent)，向vendor实际邮件renewal请求并保留原金额/日期。procurement@ourcompany.example.com邮件汇总实际处理全部vendor、金额、日期，不标Renewed或改源合同。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-09T00:00:00Z 为时间基准。
