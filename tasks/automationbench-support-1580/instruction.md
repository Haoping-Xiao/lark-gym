处理open loyalty票，按ss_loyalty逐邮箱累计Order Value减Return Value，以1净美元=1历史积分；Tier Benefits倍率不追溯应用历史消费。tier由累计earned积分确定，兑换只扣available余额不降低已获tier，核实缺失订单若已计入不得重复充值。源无账户余额/履约系统，新增loyalty_balances每位已处理客户一条(customer_email/earned_points/available_points/tier)，合格兑换新增loyalty_redemptions(customer_email/ticket_id/reward/points_cost/status=Approved/batch_reference)，作为本地奖励批准台账，不声称外部发券。每票gorgias_replies公开回复积分/等级；退货说明扣减，兑换说明奖励/花费/余量。ws_loyalty_log逐票Action=Balance review或Redeem，Details含票ID与处理详情。群及Loyalty_Team_Email邮箱IM包含Batch_Reference、姓名及各项金额/积分/处理。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_loyalty：Loyalty Program；工作表 ws_order_history（Order History）, ws_tiers（Tier Thresholds）, ws_rewards（Rewards Catalog）, ws_loyalty_log（Loyalty Log）, ws_config（Config）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-24T09:00:00Z。
