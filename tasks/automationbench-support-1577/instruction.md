审查 open 且 order-issue 的 Gorgias 工单，交叉核对 ss_fraud/ws_orders、ws_profiles、ws_investigations，标记可疑票、加调查备注、登记 ws_fraud_log，并向 fraud-alerts 汇总已标记案件。使用 gorgias_tickets，内部备注为 gorgias_replies（ticket_id、body_text、sender_type=agent、public=false），标记不代表已证实欺诈。

tags 为文本字段，写入表示标签数组的合法 JSON 字符串；标签名称保持原值，JSON 的空格、换行及转义形式不影响标签含义。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
