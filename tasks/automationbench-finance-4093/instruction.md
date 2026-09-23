今天是 2026-02-12，按 Deposit Procedures 清理 quickbooks_payments。超过30日者保留未存、列调查；其余以今天为deposit_date，按支付方式分别创建 quickbooks_deposits（payment_method、deposit_date、payment_ids JSON数组、amount数值、memo），memo包括可用payment_number，缺少时用payment id作为来源引用，不编造支票号。同时给已存付款写 deposited=true（字符串）。向 controller@company.example.com 发飞书私聊报告按方式合计、Grand total及旧付款调查项。本次只做存款登记。汇总中逐笔列出本轮已存付款的来源金额，并与按方式合计和Grand total区分；通知或记录引用来源值时须原样保留，不得改写或舍入。

本次业务处理以 2026-02-12T09:00:00Z 为时间基准。
