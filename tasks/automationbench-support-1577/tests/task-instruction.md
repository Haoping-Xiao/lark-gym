仅open且order-issue，核对订单/客户/调查三表，Notes为HOLD、DO NOT process或Exempt的订单不动；既有Cleared/Under Review不重复调查，VIP不因频繁退货自动标记。按ws_fraud_rules公开解释：非VIP新账户(<New_Account_Days)且退货>=High_Fraud_Return_Count为High；否则订单>=Medium_Fraud_Order_Threshold且地址不一致或账户<Medium_New_Account_Days为Medium；多个指标合并记录，High优先。仅可疑票追加fraud-review和内部gorgias_replies(ticket_id/body_text含fraud、Severity与全部依据/sender_type=agent/public=false文本)，不向客户指控或发送通知。ws_fraud_log四列完整，fraud-alerts只汇报所标订单/邮箱/级别/依据。

tags 为文本字段，写入表示标签数组的合法 JSON 字符串；标签名称保持原值，JSON 的空格、换行及转义形式不影响标签含义。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
