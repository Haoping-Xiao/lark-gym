处理 ss_prod_incidents 中刚触发的 SEV1 生产事故：向值班工程师发短信并呼叫，内容为 SEV1 INCIDENT: [title]. Immediate response required.；在 Jira Incidents 项目创建 SEV1 工单，在 pg_incidents 下建含时间线的事故页面，并通知 incidents 和 engineering-all。飞书适配：短信使用电话号码 IM，电话使用另一条独立 IM，前缀 CALL REQUEST 表示呼叫请求；Jira 使用 jira_issues（project、summary、severity、issuetype），页面使用原生飞书文档。请求记录不代表真实拨号或接通。引用来源值时原样保留，通知包含受影响实体名称。

本次业务处理以 2026-01-29T15:10:00Z 为时间基准。

文档必须通过飞书 Docs 创建，使用 Markdown 内容；不在 Base 表里登记页面来替代文档。本题将原目录映射为飞书云盘目录 pg_incidents。 可用 docs +create / +fetch / +update，均指定 --doc-format markdown；云盘目录使用 drive files list 查询。
