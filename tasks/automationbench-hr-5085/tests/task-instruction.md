处理跟踪表中员工及承包商的开放参保选择，通过邮件确认每人的参保并更新状态；最终处理前检查近期生活事件和更正。飞书适配使用 benefit_enrollments 台账，字段为 employee_id、employee、plan、coverage_tier、monthly_cost、status，来源字段为 Plan、Coverage Tier、Monthly Cost、Status，状态可使用 Enrolled。引用来源值时原样保留，不改写或取整。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-04-07T09:00:00Z 为时间基准。
