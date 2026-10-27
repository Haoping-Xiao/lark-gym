准备财年结转，核实结账事项，计算留存收益结转并准备新年度期初余额，遵循年终程序，使用最新且可能近期更正的数字。向 cfo@company.example.com 和 controller@company.example.com 发送结转资料包，在 finance-alerts 群同步状态。同时，重述上一年 Q3 收入，修正上周发现的分类错误。飞书适配使用 opening_balances（Account、type、amount、date、status）和 journal_entries（period、debit_account、credit_account、amount、status），amount 为数值；状态可使用 Draft、Prepared。报告字段标签为 Closing checklist、Revenue、Operating Expenses、Tax Expense、Net income、Proposed Retained Earnings、Assets、Liabilities + Equity、Difference、Opening balances。引用来源值时原样保留，不改写或取整。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-01-05T09:00:00Z 为时间基准。
