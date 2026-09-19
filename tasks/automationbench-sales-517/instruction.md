处理业务来信 msg_deal_request_001 的商机请求，按照当前定价政策计算金额，在正确的顶层母公司下创建商机，而不是子公司。name 使用 [Account Name] - Q1 Enterprise Deal，stage_name 为 Qualification；向该公司职级最高的联系人发送确认私聊，首行为 Deal Request Received，包含公司名、商机名及计算金额。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_fin_0291：Tiered Pricing；工作表 ws_001（Pricing by Tier）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-24T09:00:00Z。
