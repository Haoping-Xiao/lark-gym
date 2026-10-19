为下周入职的新员工订购设备，按当前配置指南逐人创建包含笔记本型号和外设的配置工单，并向 IT 发送完整设备清单。Jira 工单适配为 equipment_tickets 飞书台账，字段为 summary、employee_id、department、start_date、location、laptop、peripherals、delivery；peripherals 使用 JSON 数组文本，delivery 可使用 Office、Home address required。本环境只登记请求，不执行真实采购或发货。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-04-15T09:00:00Z 为时间基准。
