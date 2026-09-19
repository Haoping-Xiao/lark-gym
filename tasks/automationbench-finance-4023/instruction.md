按收入确认政策编制年约收入确认表。将合同总价均摊至期限月数，按政策明确的 January 2026 期间计算，将有效合同追加到 ss_revrec/ws_schedule，包含 Contract、Customer、Amount。取消合同排除，尚未开始的合同在源合同表中标记 Deferred。向 controller@company.example.com 私聊完整当月排期及总额，计算金额用千分位。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_revrec：Rev Rec Workbook；工作表 ws_contracts（Active Contracts）, ws_schedule（January 2026 Schedule）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-01T10:00:00Z。
