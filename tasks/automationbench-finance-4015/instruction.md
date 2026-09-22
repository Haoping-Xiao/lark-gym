将四月份银行对账单与 quickbooks_payments 财务付款台账逐条核对。用 reference/payment_number 匹配，只报告差异：同编号金额不同为 AMOUNT_MISMATCH，仅银行存在为 BANK_ONLY，仅付款台账存在为 QB_ONLY。向 controller@company.example.com 发送报告，每项列编号、类别和双方原始金额（只存在一方则列该方金额）；不改动账本。

本次业务处理以 2026-04-15T09:00:00Z 为时间基准。
