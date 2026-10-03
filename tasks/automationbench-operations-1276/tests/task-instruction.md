读Demo Requests全部NDA Policy，筛Technical且NDA Required且无未解除CPL引用，选Estimated Value最高者。DocuSign改signature_requests(template_id/template_name/signer_email/cc_emails JSON数组/status=Sent)，向联系人实际邮件Mutual NDA签署请求并向legal@company.example.com抄送。创建nda_log(applicationId=base_sales/tableName=NDA Log/Company/Value)，然后另邮件联系人确认NDA请求已发。不要标Signed，不给其他潜客发送。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
