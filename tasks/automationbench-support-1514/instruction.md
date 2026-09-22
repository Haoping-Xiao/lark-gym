按ss_health/ws_activity与HelpScout客户精确邮箱连接SF contacts，不按姓名合并、不创建缺失联系人。匹配到的SF contact更新support_ticket_count数值、support_last_interaction原日期；按ws_rules符合者新增tasks(subject含at-risk/description含姓名邮箱组织原票数及日期/who_id/status=Not Started)。源无进度表，公开以sync_log(batch_reference/source_customer_id/contact_id/email/ticket_count/last_interaction/status=Synced)每成功同步一条。support-sync含Batch_Reference、成功sync人数及at-risk任务数，仅详列at-risk姓名/邮箱/组织/票数/日期，不列其他人的身份；不发general。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
