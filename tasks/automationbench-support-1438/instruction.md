按ss_churn风险配置、精确公司名及support_tickets.organization_id统计仅open票，含边界阈值；near-name不合并。非churned创建hubspot_tickets(subject=Churn risk - <公司>/company_name/company_id=原HubSpot ID/open_tickets数字/tier/contract_value原文/priority=HIGH/status=Open)，churned改tasks同字段priority=High/status=Not Started；来源SF accounts为空，company_id只是跨台账引用，不造SF账号。使用 agent@company.example.com 原生邮箱按CSM表通知，不给请求人或缺CSM者替补发信。ws_churn 的 Action Taken：HubSpot 工单动作必须精确写 HubSpot Ticket，Salesforce 任务动作必须精确写 SF Task，通知后才写Yes。群含风险公司数、两action数、各tier数及名称金额。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
