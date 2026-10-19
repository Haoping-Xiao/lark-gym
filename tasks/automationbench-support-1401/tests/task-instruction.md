将新 Zendesk 工单同步为 Salesforce cases。处理前并行获取 ss_blocklist/ws_orgs、ss_sla/ws_tiers、ss_config/ws_config，按 blocklist 和 SLA 筛选及定优先级；匹配请求人与 Salesforce contacts，每个 case 的 Origin=Web。已处理源票加内部注释含账户名，向 support-sync 汇总并包含 Batch_Reference。使用 support_tickets、support_comments、cases、contacts，引用来源值及相关金额时原样保留。

客服数据位于同一多维表格：support_tickets、support_users、support_organizations、support_groups 分别对应工单、请求人、客户组织、支持组。现有工单 comments 保留历史；新增备注写 support_comments，不重写历史数组。其他 CRM 引用仍用原始 ID。

本次业务处理以 2026-02-10T09:00:00Z 为时间基准。
