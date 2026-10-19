按 ss_sync_config 中匹配、标签、边界及 override 规则，将 Zendesk organizations 与 HubSpot 同步，完成后向 crm-sync 汇总。来源和目标分别为 support_organizations、hubspot_companies，新建公司可用 external_id=zendesk:<原org id> 作为稳定业务引用。引用来源值时原样保留，不改写或取整。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
