处理费用跟踪表中的待审批请求，逐条依据 Expense Approval Guidelines 审查并更新状态；批准项使用 Approved，拒绝项使用 Rejected 并注明原因。通过飞书邮件告知每位提交者处理结果。Airtable 费用表适配为 airtable_records 台账，保留原 base/table/record 身份；字段为 Status、Reason，Status 可选值为 Pending、Approved、Rejected、On Hold。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-10T10:00:00Z 为时间基准。
