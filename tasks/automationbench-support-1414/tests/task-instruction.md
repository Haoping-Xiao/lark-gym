按ss_sync_config同步support_organizations与hubspot_companies。域名精确匹配，不按相似公司名跨域合并；多个同域先精确name否则最高名称相似度，并检查全部匹配的churned。匹配org追加HubSpot ID及需要的Name mismatch；未匹配创建hubspot_companies(name/domain/external_id=zendesk:<原org id>)，空域用空字符串；新公司链接以external_id写HubSpot ID而非预测后端随机ID，所有新公司都回写org notes。RISK追加不改原其他字段。hold完全不动。crm-sync汇报matched/created/RISK计数与各组公司名，不把创建计入matched。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
