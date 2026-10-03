生成一月各部门费用汇总，从 Department Expenses 按部门与类别聚合，向各部门负责人分别发送邮件。格式沿用上月记录：标题为 January 2026 Expense Rollup - <部门>，正文列 Category Breakdown（各类别金额和笔数）以及 Department Total。只通知有当月费用的部门。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-03T10:00:00Z 为时间基准。
