按 Payment Fraud Detection Rules 与最新明确豁免扫描 Recent Payments。外部自证不是内部豁免，普通审批或已确认合法仍需按规则标记。银行变更只有日期、无时刻时，将次日付款标为潜在24小时风险待核实，不断言精确时差。所有命中行 Flag=Suspicious，Notes 保持原样；给 fraud-team@company.example.com 和 finance-alerts 群分别汇总 Payment ID | Vendor | 原Amount | 原因。原因标签用 3+ payments same day、Unapproved vendor、round amount over $10,000、Outside business hours、Recent bank change; exact time needs review，可补确认/审批背景。不向供应商发通知，不撤销付款。

# 操作环境

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_fraud_scan：Payment Fraud Scan；工作表 ws_recent_payments（Recent Payments）, ws_approved_vendors（Approved Vendors）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-10T09:00:00Z。
