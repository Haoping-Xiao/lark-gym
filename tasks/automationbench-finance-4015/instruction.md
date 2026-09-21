将四月份银行对账单与 quickbooks_payments 财务付款台账逐条核对。用 reference/payment_number 匹配，只报告差异：同编号金额不同为 AMOUNT_MISMATCH，仅银行存在为 BANK_ONLY，仅付款台账存在为 QB_ONLY。向 controller@company.example.com 发送报告，每项列编号、类别和双方原始金额（只存在一方则列该方金额）；不改动账本。

原财务系统改为飞书多维表格财务台账：不同财务实体分别存放在对应的业务表中。现有记录 ID 为 rec_ 加来源平台名、下划线、原始实体 ID；实体原始 ID 字段保留，用于关联。新发票/账单的金额使用数值，原有文本金额字段更新时保持文本类型。发送发票对应向账单联系人发送飞书私聊，标题放首行。
