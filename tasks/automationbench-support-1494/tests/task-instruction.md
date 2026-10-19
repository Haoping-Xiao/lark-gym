按ss_merge_rules，只有subject完全相同且requester_id相同的open(status2)票能合并。源数据无创建时间，公开约定同组ID字典序最小为original。其余duplicate关为status5，双向新增私有freshdesk_notes(ticket_id/body/private=true文本)：duplicate说明Merged into originalID，original说明Merged duplicate ID并完整带入duplicate description，原描述/历史不删除，original保持原status。每对ws_log一行，support-merges报告merge数/配对ID/subject。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
