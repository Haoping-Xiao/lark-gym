从 ss_leases/ws_active 选择规模最大、已可续约的商业办公室租约。使用 Commercial Lease Renewal 模板向 landlord 发请求，抄送 facilities@company.example.com 和 finance@company.example.com；在 Facilities Management 建 Lease Renewal: [Office Name] 任务，在 pg_leases 建 Lease Renewal - [Office Name] 页面，再向 landlord 发送主题 Lease Renewal Notice: [Office Name] 的确认邮件。DocuSign 适配为 signature_requests（template_id、template_name、signer_email、cc_emails JSON 数组、status=Sent、office、monthly_rent、expiry_date）及邮件请求，Jira 为 jira_issues，页面为飞书文档。引用来源值时原样保留，不改写或取整。

来信读取及向邮箱地址发送通知均使用飞书邮件；手机号及员工账号对应的通知使用已提供的飞书私聊，群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-01T09:00:00Z 为时间基准。

文档必须通过飞书 Docs 创建，使用 Markdown 内容；不在 Base 表里登记页面来替代文档。本题将原目录映射为飞书云盘目录 pg_leases。 可用 docs +create / +fetch / +update，均指定 --doc-format markdown；云盘目录使用 drive files list 查询。
