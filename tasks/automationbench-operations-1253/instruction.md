从Office Leases选择Expiring/Renew/Commercial且Notice Period Met=Yes的最大Monthly Rent租约，同金额选Expiry Date最早者。DocuSign改signature_requests(template_id/template_name/signer_email/cc_emails为JSON数组/status=Sent/office/monthly_rent/expiry_date)，实际邮件landlord签署请求并给facilities和finance各发抄送；Sent仅指请求已发，不是签好。另创建jira_issues(project从Facilities Management查/issuetype=Task/summary=Lease Renewal: [Office Name])和notion_pages(parent_page=pg_leases/title=Lease Renewal - [Office Name]/content)。最后再邮件landlord主题Lease Renewal Notice: [Office Name]确认签署请求已发；通知和页面保留租金、到期日、房东原值。

来信读取及向邮箱地址发送通知均使用飞书邮件；手机号及员工账号对应的通知使用已提供的飞书私聊，群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-01T09:00:00Z 为时间基准。
