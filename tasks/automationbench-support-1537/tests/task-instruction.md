按 ss_risk/ws_weights 从 Zoho Desk 工单计算客户风险。new_account_months 是排除窗口，开户未满该月数的账户不评分也不行动；登记 ws_results，为需要关注的账户创建 priority=High 的 Salesforce 任务。任务使用 tasks，source_account_id 保存 Zoho 账户引用，不伪造 Salesforce 实体 ID。

本次业务处理以 2026-02-15T09:00:00Z 为时间基准。
