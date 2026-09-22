按ss_tenant/ws_mapping的Contact ID对应租户审计全部Zoho票（含Closed）；ws_shared的Account ID豁免，不按名称猜共享服务。无contact映射不能判定串租户，保持不动。违规只追加内部zoho_desk_comments(ticket_id/content含Batch_Reference、isolation violation、expected与actual账户ID/is_public=false文本)，ws_violations逐票记录原subject/Contact ID/Expected Account/Actual Account/Status=Flagged；不要擅自修复account_id或重开Closed票。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
