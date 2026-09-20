按 Reporting Policy 处理财务比率评审。禁发期间只能在内部 ratio_workpapers 飞书台账准备底稿，不能在私聊或群里披露任何数值、契约分析或计算结果；可向 cfo@company.example.com 仅说明 embargo 阻止分发。本题财务原表 Current Assets 仍含需扣除的40000过时库存，先从Current Assets和Inventory同时扣除再计算；比率保留四位小数字符串，Net Profit Margin保留百分比四位。底稿字段 ratio、value、target_status=Meets/Below/Above/Unknown、covenant_status=Pass/Fail/Not applicable/Insufficient data。缺债务偿付材料的DSCR不猜测，value为空。只准备底稿，不变更贷款或通知群。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_ratios：Financial Ratios；工作表 ws_reporting_policy（Reporting Policy）, ws_financials（January 2026 Financials）, ws_targets_ratios（Ratio Targets）, ws_loan_covenants（Loan Covenants）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-10T09:00:00Z。
