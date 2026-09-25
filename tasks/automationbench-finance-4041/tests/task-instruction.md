今天2026-02-12，按 Refund Policy - Updated 2026 处理退款，每个Pending请求视为今天收到，以今天距Invoice Date判定天数。合格退款写 quickbooks_refunds 台账，字段case、invoice_number、customer_id、customer_name、amount数值、status=Processed，并将表Status写Refunded，新增Refund Amount美元千位逗号。超期只Offer credit memo，不实际退款或创建credit memo，Status写Credit memo offered；等待审批者来源行不改。每个客户私聊通知case、发票、原金额、处理结果及退款金额或待办原因。通知或记录引用来源值时须原样保留，不得改写或舍入。customer_name 可采用对应申请表 Customer 或已正确匹配客户主档的 display_name 原文，客户ID、申请和发票的关联必须一致。

本次业务处理以 2026-02-12T09:00:00Z 为时间基准。
