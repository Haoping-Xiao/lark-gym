处理 ss_shipments/ws_outbound 中 Hazardous 国际货件，跳过 Domestic 及 Notes 含 Reclassified 者，仅 Declaration Status=Missing 者需要申报。使用 International Hazmat Declaration 而非 Domestic 模板，向 shipper 联系邮箱发送签署请求。向 compliance@company.example.com 邮件所有需申报货件，向 logistics 汇总 shipment IDs、目的地和总数。DocuSign 适配为 signature_requests（template_id、template_name、shipment_id、destination、declared_value、signer_email、status=Sent）及邮件请求，不向真实监管机关提交。引用来源值时原样保留，不改写或取整。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-09T09:00:00Z 为时间基准。
