处理本轮晋升，更新员工的新职称和工资，向每位晋升员工发送祝贺邮件，并在 celebrations 群公告。来源未提供 BambooHR 员工实体，飞书适配使用 employee_records 台账登记变更，字段为 employee_id、name、title、salary、effective_date。引用来源值时原样保留，不改写或取整。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-03-20T09:00:00Z 为时间基准。
