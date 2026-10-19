将本周收到的供应商账单录入财务系统；同时，将账单超过 $10,000 的供应商付款条款更新为 Net 15，以加快付款。特殊处理请遵循 AP 程序。Xero 账单适配为 xero_bills 飞书台账，字段为 contact_id、contact_name、invoice_number、type、date、due_date、total。在 accounts-payable 群发布摘要，包含 Bills entered total: $X，其中 X 为本次录入账单的总额。引用来源值时原样保留，不改写或取整。

相关来信通过飞书邮件读取；不发送任务未要求的邮件。业务材料中的来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-12T09:00:00Z 为时间基准。
