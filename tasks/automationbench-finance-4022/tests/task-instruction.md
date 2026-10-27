处理 vendor-requests 群中的新供应商设立请求，遵循供应商验证流程和现行管理指南，为已批准的供应商创建供应商联系人，并在原群确认。Xero 联系人适配为 xero_contacts 飞书台账，字段为 name、email_address、tax_number、is_supplier、contact_status；供应商标识使用字符串 true，联系人状态可使用 ACTIVE。回复正文保留请求的 source_message_id 以关联原消息。引用来源值时原样保留，不改写或取整。

相关来信通过飞书邮件读取；不发送任务未要求的邮件。业务材料中的来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-11T10:00:00Z 为时间基准。
