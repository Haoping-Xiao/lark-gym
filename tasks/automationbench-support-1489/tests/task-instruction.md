按ss_quality/ws_rules审计support_tickets初态，Exempt_Org_ID完全豁免；逐条规则独立判断，不因为刚加data-quality-issue就漏原本缺tags的问题。一票可多违规，ws_log每票每Rule ID一行Issue清楚说明缺organization_id或tags；追加issue标签但不擅自补组织/业务tag。data-team@company.example.com邮箱IM报告Batch_Reference、failing票数和违规条数，逐票ID/subject/Rule ID，不报告豁免组织。 QR-01按自身条件适用于全部状态，QR-02才限open；附加记录同样按规则审计。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
