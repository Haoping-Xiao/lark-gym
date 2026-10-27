为员工报名所需合规培训，匹配正确场次，通过邮件告知日期及时间并更新跟踪表；报名之前检查排期和部门变化。飞书适配使用 training_enrollments 台账，字段为 employee、email、session、training、date、time、status，status 可使用 Enrolled；跟踪表使用 Status、Anti-Harassment Status、Enrolled Sessions，状态可使用 Partially Enrolled、Awaiting Makeup，场次编号使用逗号空格分隔。来源没有时区，因此保留原时间文本、不创建日历。引用来源值时原样保留，不改写或取整。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-04-07T09:00:00Z 为时间基准。
