今天为 2026-02-09，检查 ss_contracts/ws_active 及 ws_policy 的续约窗口，处理近期需要人工续约的合同，跳过自动续约及已经处理的合同。使用 renewal 模板向合格供应商发送协议请求，向 procurement@ourcompany.example.com 汇总。DocuSign 适配为 signature_requests（template_id、template_name、signer_email、vendor、annual_value、expiry、status=Sent）和原生邮件签署请求。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-09T00:00:00Z 为时间基准。
