固定2026-02-13，处理open product-inquiry，按ss_inventory库存、价格生效日、召回、SKU停售、过时库存及授权规则答复。检查已有信息来源；本题无额外邮箱信件，不可臆造履约更新。仅VP级且产品+客户邮箱匹配才批准reserve优先发货；经理请求不覆盖backorder。容许显著拼写变体匹配真实目录，多产品逐一答复，不猜未知产品。有限库存不可承诺超数量订单。新增gorgias_replies(ticket_id/body_text/sender_type=agent/public=true文本)，原消息保留；价格、ETA与响应政策关键信息必须准确。ws_routing_log每票一行，多产品按提及顺序用分号空格拼Product/Status/Action；标准Action=Respond，特例Route safety-team/clearance-team/inventory-check或Priority fulfillment。普通无法供应的票达3张则群汇总逐票产品与状态，召回仅safety-team含原因/客户，不入普通库存告警；SKU停售进clearance-team，过时进inventory-check。

本次业务处理以 2026-02-13T09:00:00Z 为时间基准。
