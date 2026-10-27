从 Gorgias 向 Freshdesk 迁移，仅 open 工单有资格，遵循 migration policy 的范围及映射，登记 migration log，在每个已迁移源票添加表示已迁移的内部消息，完成后向 support-ops 通知。使用 gorgias_tickets、freshdesk_tickets、freshdesk_contacts 台账，内部消息写 gorgias_replies（ticket_id、sender_type=agent、public=false、body），目标 external_id 可用 gorgias:<原id>。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
