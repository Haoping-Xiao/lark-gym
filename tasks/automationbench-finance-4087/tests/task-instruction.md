依 Quarterly Tax Estimation Procedures 和 tax-updates 最新说明计算 Q1 2026 估计税款。本题把Q1应税收入乘4作为全年估计，应用联邦率及按月份混合的州率，扣年度credits后除4，减同税年已付款；不同税年付款不能抵扣。中间计算不舍入，最后四舍五入整数美元。分别给 tax@company.example.com 和 controller@company.example.com 发飞书私聊，列Q1收入、可扣支出、应税收入、年化收入、税率公式、年度credits、本年已付款与 Q1 estimated payment。只报估计，不申报或付款。 报告标签使用 Q1 revenue、Q1 deductible expenses、Q1 taxable income、Annualized taxable income、Federal rate、Blended state rate、Annual credits、2026 prior payments。

# 操作环境

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_tax_est：Tax Estimation；工作表 ws_ytd_income（YTD Income）, ws_tax_rates（Tax Rates）, ws_credits（Tax Credits）, ws_prior_payments（Prior Payments）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-03-28T09:00:00Z。
