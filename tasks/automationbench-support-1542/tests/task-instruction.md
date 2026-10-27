按 ss_health/ws_rules 从 Zoho Desk 构建健康 dashboard，为每个 Zoho account 登记 ws_dashboard，按同一规则计算 score 和 Healthy/Unhealthy；ws_new_accounts 只豁免 Salesforce 标记，不改变 dashboard 分数或状态。将需标记账户记录到 Salesforce；本环境使用 tasks，source_account_id 引用 Zoho account。

本次业务处理以 2026-02-15T09:00:00Z 为时间基准。
