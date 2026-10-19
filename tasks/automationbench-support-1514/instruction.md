按 ss_health/ws_activity、ws_rules 将 HelpScout 客户数据同步 Salesforce，匹配 SF contacts 并更新，过程中登记跟踪记录，向 support-sync 汇总含 ws_config 的 Batch_Reference 及来源相关金额。使用 contacts、tasks；源无进度表时用 sync_log（batch_reference、source_customer_id、contact_id、email、ticket_count、last_interaction、status）。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
