处理最新网站表单，按ICP表评分并入CRM leads，再更新来源Status=Processed、Lead_Score和SF_Lead_ID，达群提醒条件才发high-value-leads。不处理已完成或显式内部测试行。新lead保留姓名、邮箱、公司、职位及use_case，评分保存lead_score；SF_Lead_ID在飞书迁移中使用稳定业务引用lead:<Email>，新lead external_id保存同值，非后端随机record_id。未达MQL者status=New，已有表格字段不改。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
