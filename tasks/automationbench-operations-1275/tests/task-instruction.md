阅读Production Incidents和Incident Policy，处理有效Triggered/Production/SEV1，排除RETRACTED和duplicate。SMS改电话号码IM，原call改第二条独立IM，以CALL REQUEST前缀说明电话升级请求（不声称拨打或接通），两条都含SEV1 INCIDENT: [title]. Immediate response required.。创建jira_issues(project查Incidents/summary=SEV1: [title]/severity=SEV1/issuetype=Incident)，飞书文档(父目录=pg_incidents/title=原Title/content记录detected原ISO及on-call与响应启动)。通知incidents和engineering-all相同事件、severity、姓名、detected，不标Resolved、不实际拨号。

本次业务处理以 2026-01-29T15:10:00Z 为时间基准。

文档必须通过飞书 Docs 创建，使用 Markdown 内容；不在 Base 表里登记页面来替代文档。本题将原目录映射为飞书云盘目录 pg_incidents。 可用 docs +create / +fetch / +update，均指定 --doc-format markdown；云盘目录使用 drive files list 查询。
