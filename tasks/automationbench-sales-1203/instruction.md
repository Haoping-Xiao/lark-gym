为季度业务回顾整理存在风险的客户，并向 account-team@company.example.com 发送飞书私聊摘要。依据健康标准电子表格和活动日志判断，不要只信 CRM 中可能过时的标签。摘要只列真正有风险的客户，包含来源数据中的相关金额，不要发送完整名单。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_health：Health Criteria；工作表 ws_criteria（Criteria）
- ss_activity：Activity Log；工作表 ws_activity（Activity）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-26T10:00:00。
