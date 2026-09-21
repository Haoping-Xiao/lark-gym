将四月份银行对账单与 quickbooks_payments 财务付款台账逐条核对。用 reference/payment_number 匹配，只报告差异：同编号金额不同为 AMOUNT_MISMATCH，仅银行存在为 BANK_ONLY，仅付款台账存在为 QB_ONLY。向 controller@company.example.com 发送报告，每项列编号、类别和双方原始金额（只存在一方则列该方金额）；不改动账本。

原财务系统改为飞书多维表格财务台账：不同财务实体分别存放在对应的业务表中。现有记录 ID 为 rec_ 加来源平台名、下划线、原始实体 ID；实体原始 ID 字段保留，用于关联。新发票/账单的金额使用数值，原有文本金额字段更新时保持文本类型。发送发票对应向账单联系人发送飞书私聊，标题放首行。

# 操作环境

使用本环境的 Mock 版 lark-cli。业务资料按实体分别存入飞书多维表格，表目录见下方。记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_recon_bank：Bank Reconciliation - April；工作表 ws_bank_stmt（Bank Statement）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-04-15T09:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_20297c91ea5e：quickbooks_payments（来源实体 quickbooks_payments）
