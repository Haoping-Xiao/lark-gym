今天是 2026-02-15。读取最新 Invoice Void Procedures、例外来信与 billing 群更正，按更新时间采用当前账龄窗口，部分收款及仍在催收/法务暂停者不作废。作废合格 quickbooks_invoices：voided=true（字符串）、total_amt/balance=0（字符串），void_memo 记录窗口、无收款及催收状态依据；保留原 note 和其他字段。逐分配销售发飞书邮件，billing 群汇总原客户、发票号、原金额及结果。只影响模拟账务。 void_memo 用 Over 210 days; no payments; 后加 no active collection case 或 outside counsel case dismissed 描述对应依据。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-15T09:00:00Z 为时间基准。
