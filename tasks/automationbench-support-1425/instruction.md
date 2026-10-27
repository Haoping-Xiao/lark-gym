今天为 2026-02-01，按 ss_refund_policy 处理 Gorgias 退款请求，用其规则和订单资料决定起草确认或升级 Jira FIN 项目的 Task。ws_refund_log 的 Action 使用 Draft、Escalated、Not Found、Expired、Denied；逐票回复对应包含 confirmation、escalated、not found、window、denied 的结果词，并向 finance-ops 汇总。Gorgias 回复用 gorgias_replies，Jira 用 jira_issues（project、issuetype、summary、ticket_id、description）；Gmail 草稿适配为飞书邮箱真实草稿，起草不代表实际退款。引用来源值及相关金额时原样保留，不改写或取整。

邮件收发和草稿均使用飞书邮箱。草稿不要发送；工单备注与处理日志仍保存在相应飞书业务表，保持草稿与原工单及联系人的对应关系。

本次业务处理以 2026-02-01T12:00:00Z 为时间基准。
