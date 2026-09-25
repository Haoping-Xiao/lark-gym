跨Re:amaze unresolved和Freshdesk开放票(status2/3)去重，先用contact邮箱及ss_dedup/ws_aliases确认为同一客户，再核对subject/正文是否同一问题；同客户不同问题、同问题不同客户均不能合并。重复项Re:amaze标resolved并新增内部reamaze_notes(conversation_id/author_type=staff/body含Freshdesk ID/internal=true文本)；Freshdesk新增私有freshdesk_notes(ticket_id/body含Re:amaze ID/private=true文本)，原状态不变。ws_log每对写Reamaze ID/Freshdesk ID/Email=原Re:amaze邮箱（保留alias）/Status=Deduplicated。无匹配不动、不发外部回复。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
