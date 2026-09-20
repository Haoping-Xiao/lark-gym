今天是 2026-01-10。仅汇总日期在 Q4 2025 的付款，按供应商总支出降序选前五；占比以该季度全部付款为分母。未来30天内到期（含端点）标 Due soon，其余 Not due。根据采购政策处理供应商整合要求，向 procurement@company.example.com 发飞书私聊，Overall spend | 总额，逐行 Vendor | 总额 | 占比（两位小数） | Contract End | 状态；如需终止合同仅提交建议，不修改合同或付款。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_spend：Vendor Spend Data；工作表 ws_procurement_policy（Procurement Policy）, ws_q4_payments（Q4 2025 Payments）, ws_contracts（Contract Renewals）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-01-10T09:00:00Z。
