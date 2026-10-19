处理 Gorgias loyalty program 工单，查 ss_loyalty 客户数据、判断 tier 并处理请求，记录全部工作，向 loyalty team 汇总，邮件及群摘要包含 ws_config 的 Batch_Reference。Gmail 适配为飞书邮箱；本环境用 loyalty_balances（customer_email、earned_points、available_points、tier）和 loyalty_redemptions（customer_email、ticket_id、reward、points_cost、status、batch_reference）记录余额及兑换批准，不实际外部发券。客服回复用 gorgias_replies。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
