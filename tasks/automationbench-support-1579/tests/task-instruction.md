固定2026-02-13，处理open product-inquiry，按ss_inventory库存、价格生效日、召回、SKU停售、过时库存及授权规则答复。检查已有信息来源；本题无额外邮箱信件，不可臆造履约更新。仅VP级且产品+客户邮箱匹配才批准reserve优先发货；经理请求不覆盖backorder。容许显著拼写变体匹配真实目录，多产品逐一答复，不猜未知产品。有限库存不可承诺超数量订单。新增gorgias_replies(ticket_id/body_text/sender_type=agent/public=true文本)，原消息保留；价格、ETA与响应政策关键信息必须准确。ws_routing_log每票一行，多产品按提及顺序用分号空格拼Product/Status/Action；标准Action=Respond，特例Route safety-team/clearance-team/inventory-check或Priority fulfillment。普通无法供应的票达3张则群汇总逐票产品与状态，召回仅safety-team含原因/客户，不入普通库存告警；SKU停售进clearance-team，过时进inventory-check。

# 操作环境

使用本环境的 Mock 版 lark-cli。业务资料按实体分别存入飞书多维表格，表目录见下方。记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_inventory：Product Inventory；工作表 ws_products（Products）, ws_alternatives（Alternatives）, ws_response_policy（Response Policy）, ws_routing_log（Routing Log）, ws_price_overrides（Seasonal Price Updates）, ws_recalls（Product Recalls）, ws_vp_overrides（Backorder Priority Overrides）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-13T09:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_45f2a400f1c1：gorgias_replies（来源实体 gorgias_replies）
- tbl_47cb447a172a：gorgias_tickets（来源实体 gorgias_tickets）
