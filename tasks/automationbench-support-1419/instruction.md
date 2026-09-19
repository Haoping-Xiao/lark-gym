按完整email连接intercom_contacts、history、spend、DNC和outreach历史。churned且无active、无已发送tag/历史才候选，缺history不猜；Recent_Churn_Days用于标题非拒绝，离开>Old_Churn_Days用Old_Subject，其余（含中间30–90）补定Recent_Subject。Total Spend严格超过threshold才升一级优惠。Gmail转邮箱IM，保留name/plan/原spend和对应offer；发送成功后追加win-back-sent并outreach日志，原计划不因优惠升级修改。customer-success仅汇总已发送人数/姓名/优惠，不列Skipped。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_history：Customer History；工作表 ws_customers（Customers）, ws_outreach（Outreach Log）, ws_spend_history（Spend History）, ws_winback_config（Win-back Config）
- ss_dnc：DNC List；工作表 ws_list（DNC）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-05T09:00:00Z。
