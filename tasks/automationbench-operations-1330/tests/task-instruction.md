处理 ss_leases 中设备租赁请求，阅读申请、部门预算、采购政策及逐项备注或标记。只处理已批准且部门剩余预算可承担的申请，同部门按 Request ID 先到先处理；预算用尽后不再处理该部门剩余请求。向供应商发租赁协议签署请求，邮件申请人确认，并向 procurement 通知详情及所有已处理租赁的每月承诺总额。DocuSign 适配为 signature_requests（template_id、template_name、signer_email、request_id、equipment、monthly_cost、status=Sent）及实际邮件请求。引用来源值时原样保留，不改写或取整。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-09T09:00:00Z 为时间基准。
