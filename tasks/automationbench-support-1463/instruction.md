今天为 2026-02-10，用 ss_warranty 的 ws_products、ws_claims_policy、ws_claims_log 验证 Zoho Desk warranty claims，逐票注释 approved 或 denied；每项 approved 建 Salesforce case，subject 含产品 serial，denied 则邮件申请人。向 warranty-ops 汇总 <N> approved、<N> denied 和 Config 的 batch_tracking_code，含相关实体名称和计数。使用 zoho_desk_tickets、zoho_desk_comments、cases，Gmail 适配为飞书邮箱。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-10T12:00:00Z 为时间基准。
