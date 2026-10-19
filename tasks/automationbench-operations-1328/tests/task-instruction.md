在最终审计前核对每家供应商最新合规信息，将 Salesforce 活跃账户与 ss_compliance/ws_tracker 关联。今天为 2026-02-09，Doc Expiry 早于今天且账户状态 Active 才是不合规，向 vendor-compliance 通知供应商名、Salesforce account ID、过期文档类型及不合规总数，不通知已 Inactive 的供应商。Salesforce 适配为 accounts 台账；源 accounts 缺 status，本适配将 tracker 的 SF Status 作为账户状态快照。引用来源值时原样保留，不改写或取整。

相关来信通过飞书邮件读取；不发送任务未要求的邮件。业务材料中的来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-09T09:00:00Z 为时间基准。
