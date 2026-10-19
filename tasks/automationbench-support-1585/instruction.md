按 ss_capacity/ws_roster、ws_benchmarks 分析 Zoho Desk 各部门负载，从超负荷人员重新分派工单，每个移动票加含 redistributed 的内部注释。登记 ws_report，人员引用使用 roster Agent_ID，邮件 capacity report 且主题含 capacity，向 capacity-planning 汇总。使用 zoho_desk_tickets、zoho_desk_comments；源缺报告邮箱时使用 capacity@support.example.com，Gmail 适配为飞书邮箱。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
