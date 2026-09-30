按照 Expense Approval Guidelines 处理 Expense Requests 的Pending项，数据已映射到 airtable_records 飞书台账，保留原base/table/record身份。Approved项更新Status；不合规项Rejected并新增Reason；须VP审批的高额设备写Status=On Hold、Reason说明而不是Rejected。餐费按明确人数分摊。逐提交者发飞书邮件告知姓名、原金额、状态和理由，不能只通知不更新记录。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-10T10:00:00Z 为时间基准。
