按 ss_sync_config 映射规则将 Zendesk organizations 同步到 Intercom，正确迁移 tags、避免重复，并向 customer ops 群汇总。来源为 support_organizations，目标为 intercom_companies（name、domain、tags、external_id），external_id 可用 zendesk:<org id>。引用来源值时原样保留。

组织记录 ID 的迁移规则为 rec_zendesk_ 加原始组织 ID；生成 external_id 时只移除 rec_zendesk_ 前缀，完整保留其余原始 ID（包括 org_ 等原有部分）。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
