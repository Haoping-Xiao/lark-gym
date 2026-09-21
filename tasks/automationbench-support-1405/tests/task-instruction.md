处理gorgias_tickets中open且order-inquiry精确tag订单咨询，完整订单号匹配，不做前缀匹配；每票逐个订单查询。此题继承源fixture允许代查询，不额外推断授权流程。按当前提问customer邮箱查VIP前缀，cancelled查refund资格，backordered明确转fulfillment，未找到/未给号请求补充，不猜status。回复写gorgias_replies(ticket_id/sender_type=agent/body)，作为客服回复台账，不改原messages/status。每次成功lookup（按ticket+order计，不按订单全局去重）追加ws_order_log四字段，Customer为提问者姓名。order-support群按小写status汇总处理lookup数、姓名，另列回复ticket数与未找到/缺号数。

# 操作环境

使用本环境的 Mock 版 lark-cli。业务资料按实体分别存入飞书多维表格，表目录见下方。记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_orders：Order Tracking；工作表 ws_orders（Orders）, ws_vip_orders（VIP Customers）, ws_refund_policy（Refund Policy）, ws_order_log（Order Log）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-24T09:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_45f2a400f1c1：gorgias_replies（来源实体 gorgias_replies）
- tbl_47cb447a172a：gorgias_tickets（来源实体 gorgias_tickets）
