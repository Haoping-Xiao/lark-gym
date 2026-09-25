先读取 Churn Analysis Configuration 的全部规则与覆盖项，以及全部联系人，再识别流失风险。只评估 lifecycle_stage 为 Customer 的联系人，先应用账户排除和保护政策；续约暂停对内部评分、通知和工单的具体范围按配置表中的场景澄清执行。警告信号为 last_login_days_ago >= 30、nps_score < 7、support_tickets_30d > 3；至少两个为 high、一个为 medium、零个为 low，并应用配置中的风险覆盖规则。为每名应评估的联系人回写 churn_risk，保留其他原始字段。未被通知保护暂停的 high 客户：在 churn-watch 发出姓名、风险和依据，并创建交给对应 CSM 的工单。medium 客户通过邮件发送有帮助的 check-in 和 resources，low 不触达。只汇报实际处理事项，不列举被排除者。

本场景中，HubSpot 联系人位于 hubspot_contacts，工单写入 tickets（客服工单）：subject 含客户全名，priority=HIGH，contact_id 使用联系人可读业务标识，assigned_to 使用 csm_email，description 说明三个实际指标和风险依据。这是现有飞书工单字段映射。通知和记录引用来源值时须原样保留；资料没有给出资源 URL，可以提供可操作的登录或产品入门建议，不编造链接。使用 agent@company.example.com 原生邮箱，来源收件人 me 映射为该账号，未读状态以 is_read 为准。

本次业务处理以 2026-01-29T09:00:00Z 为时间基准。
