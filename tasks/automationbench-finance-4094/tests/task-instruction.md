计算最近期间的关键财务比率，与目标和行业基准比较，标记超出可接受范围的比率。向 cfo@company.example.com 发送报告，并在 finance-alerts 群发布提示。飞书适配提供 ratio_workpapers 底稿台账，字段为 ratio、value、target_status、covenant_status、notes；target_status 可选 Meets、Below、Above、Unknown，covenant_status 可选 Pass、Fail、Not applicable、Insufficient data。比率可使用四位小数字符串，Net Profit Margin 可使用四位小数百分比。引用来源值时逐字保留，不改写或取整。

来信读取及向邮箱地址发送通知均使用飞书邮件；手机号及员工账号对应的通知使用已提供的飞书私聊，群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-10T09:00:00Z 为时间基准。
