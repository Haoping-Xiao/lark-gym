依 Payroll Review Procedures 比较当前与上一期工资，只报告绝对变动率严格超过10%的员工，并列新员工但不标异常；本期零工资的离职员工排除。给 hr@company.example.com 和 controller@company.example.com 分别发飞书私聊，异常行 Employee | 上期原金额 | 本期原金额 | 有符号差额 | 有符号变化率（两位小数）。不更新工资表或执行支付。

# 操作环境

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_payroll：Payroll Data；工作表 ws_current（Feb 1-15 2026）, ws_previous（Jan 16-31 2026）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-15T09:00:00Z。
