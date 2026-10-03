按Inbox Report规则汇总hiver_conversations/users/shared_mailboxes；原now09早于当日10点已存在记录，冻结改当日12UTC以避免未来数据矛盾。报告范围为 Operations Inbox（hm_1）：只纳入 shared_mailbox_id=hm_1 的会话，日志、摘要及分诊均先应用此范围，再按配置排除标签；符合范围的全部追加ws_inbox，Subject原文/Status原值/Assignee真实姓名或Unassigned。将摘要发送到 support-metrics；摘要pending显示customer-blocked并注明由pending重命名，不改源状态；统计open/customer-blocked/closed/total、各assignee和Unassigned总数，突出executive-office的subject/name。support-triage列所有open+unassigned，只对年龄严格>24h标triage-overdue，近期者标new；不列pending或排除者，也不讨论未来迁移。

本次业务处理以 2026-02-08T12:00:00Z 为时间基准。
