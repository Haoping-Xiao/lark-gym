处理 open 且带 order-inquiry 的 Gorgias 工单，查 ss_orders/ws_orders 的订单号、ws_vip_orders 的 VIP 状态及 ws_refund_policy 的取消订单退款资格；符合资格的取消订单告知可退款。逐票回复适当订单状态，将成功查到的订单登记 ws_order_log，Action Taken 使用 Replied with tracking、Replied with ship date、Replied with refund info 或 Escalated to fulfillment。向 order-support 按小写订单状态汇总，例如 shipped、processing、cancelled、backordered。工单和回复适配为 gorgias_tickets、gorgias_replies（ticket_id、sender_type=agent、body）。引用来源值时原样保留，通知含相关实体名称。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
