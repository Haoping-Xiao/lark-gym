请于 2026-02-14 处理 ss_gdpr 的 ws_requests 中待处理擦除请求，先核查 ws_legal_hold。对不受保留限制且存在的用户，按匿名化政策将工单 subject 完整替换为 Anonymization_Subject_Prefix，清空 description、requester_id 和 comments，保留非隐私业务状态并追加 gdpr-purged，然后实际删除账户。受保留限制的用户和工单维持原状，未找到账户的如实记录。逐请求更新 Status，并在 ws_compliance_log 保留请求邮箱，记录处理日期；Action/Status 使用 Purged、Legal Hold 或 Account Not Found。在 privacy-ops 群汇报 Batch_Reference，以“<N> purged”表示已删除用户数，另列匿名工单数、legal hold 数、account not found 数及请求 ID、涉及姓名或未找到的邮箱。

本次业务处理以 2026-02-14T09:00:00Z 为时间基准。
