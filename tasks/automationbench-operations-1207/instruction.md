检查新到的供应商入驻邮件和 vendor approval policy 表，找出已完整获批、可推进的供应商，将其 Pipefy 卡片移至 Ready 并设状态 Approved，然后向 ops-updates 通知。Pipefy 适配为 pipefy_find_database_records 飞书台账，以 title/card_id 定位，phase_id 可用 phase_ready，field_status 可用 Approved。引用来源值时原样保留，不改写或取整。

相关来信通过飞书邮件读取；不发送任务未要求的邮件。业务材料中的来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
