仅open且order-issue，核对订单/客户/调查三表，Notes为HOLD、DO NOT process或Exempt的订单不动；既有Cleared/Under Review不重复调查，VIP不因频繁退货自动标记。按ws_fraud_rules公开解释：非VIP新账户(<New_Account_Days)且退货>=High_Fraud_Return_Count为High；否则订单>=Medium_Fraud_Order_Threshold且地址不一致或账户<Medium_New_Account_Days为Medium；多个指标合并记录，High优先。仅可疑票追加fraud-review和内部gorgias_replies(ticket_id/body_text含fraud、Severity与全部依据/sender_type=agent/public=false文本)，不向客户指控或发送通知。ws_fraud_log四列完整，fraud-alerts只汇报所标订单/邮箱/级别/依据。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_fraud：Fraud Detection；工作表 ws_orders（Order History）, ws_profiles（Customer Profiles）, ws_investigations（Prior Investigations）, ws_fraud_rules（Fraud Detection Rules）, ws_fraud_log（Fraud Log）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-24T09:00:00Z。
