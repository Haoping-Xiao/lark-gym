只对Closed票按ss_patterns/ws_keywords匹配subject+description，大小写不敏感，多类取最小Priority，Open/On Hold和无匹配排除。ws_analytics每配置Category一行Count文本；类别总量>=3生成类别级issues(project=KB/issuetype=Story/summary含Category/description含category和count)，Jira Created=Yes，否则No。VP账户例外另按account+category产生Epic，不受3票门槛，且该账户不创建账户级Story；类别级聚合Story仍保留。Epic description列该账户类别的来源票ID/subject，source_account_id。support-analytics报告每类count、Story数与例外账户Epic，不声称未匹配已归类。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_patterns：Resolution Patterns；工作表 ws_keywords（Keyword Rules）, ws_analytics（Pattern Analytics）, ws_policies（Analysis Policies）, ws_vp_exceptions（VP Account Exceptions）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-24T09:00:00Z。
