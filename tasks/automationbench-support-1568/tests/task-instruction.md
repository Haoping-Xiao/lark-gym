按ss_customers客户Tier与Notes、ws_queue_config路由仅open且group_id空的工单。HOLD/SUSPENDED公司完全不处理，不出现在路由结果。Enterprise总是senior；Premium按priority>=3、大数据/多系统复杂性判断；未知tier一般队列。只改group_id，每票新增freshdesk_notes(ticket_id/private=true文本/body含routed、queue、Tier、复杂性及领域说明)，保留历史/priority/tags。support-routing逐票ID和Queue_Group_ID、total routed数量。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
