为各部门经理设置每周办公答疑时间，通过邮件通知团队，并取消已换岗经理的旧答疑安排，执行前检查近期组织变化。Calendly 适配为 office_hours 飞书台账，字段为 name、manager_email、departments、duration_minutes、frequency、booking_ref；departments 使用 JSON 数组文本，frequency 可使用 weekly，name 使用 [Manager Name] - Office Hours，booking_ref 使用 lark-gym://office-hours/manager_email，引用模拟预约资料而非真实 Calendly 地址。引用来源值时原样保留，不改写或取整。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-04-07T09:00:00Z 为时间基准。
