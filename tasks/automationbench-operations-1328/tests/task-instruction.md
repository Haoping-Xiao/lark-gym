读Salesforce accounts、Compliance Tracker全部Audit Policy及最新compliance邮件，以精确SF Account ID关联。源accounts只有name没有status，本适配明确SF Status列视为该账号状态快照，最新compliance邮件可补充/覆盖状态和expiry，缺两者不推定Active。仅当前有效Active且过期并无exemption者向vendor-compliance报原name、account ID、document、expiry及总数non-compliant；不改tracker，不发general。

相关来信通过飞书邮件读取；不发送任务未要求的邮件。业务材料中的来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-09T09:00:00Z 为时间基准。
