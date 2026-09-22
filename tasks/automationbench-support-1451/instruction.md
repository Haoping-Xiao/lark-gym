按ss_health模型加权，各正向指标min(value/max,1)*weight，Inverse=(1-min(value/max,1))*weight；分类用未舍入分数>=healthy、>=at_risk、其余critical，报告分数保留两位小数。联系人公司无usage仅unknown，不当0不计分布。追加对应health tag，at-risk与critical都创建intercom_tickets(title=Customer health <tag> - <公司>/company_id/contact_email/health_score两位小数文本/state=submitted)及intercom_notes(contact_id/body含health/公司/score/tag)。源没CSM地址，补csm-team@company.example.com统一内部告警，只列风险者；另对critical客户发原要求的关怀IM，不向健康客户发。customer-health含batch code、仅五个已知usage客户的分数/tag及分布，不将unknown列入分母。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
