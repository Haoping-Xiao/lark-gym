核对 ss_recon 两份发票导出，以 Invoice # 匹配，报告缺失和金额不符。明确更正记录优先作为当前金额，但重复旧记录仍作为数据清理事项报告，不能误报当前仍有金额差。备注要求排除者跳过；Under Dispute 的实际差异照报并标识争议状态。不因公司简称不同而报错。向 finance-alerts 群发逐项详情，保留发票号、客户与相关原金额，不改源数据。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_recon：Invoice Reconciliation；工作表 ws_ar_system（AR System Export）, ws_accounting（Accounting System Export）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-06T11:00:00Z。
