按This Week名单完成每位新员工入职设置。员工档案和入职工单分别使用 employee_profiles、onboarding_tickets 飞书多维表格；在飞书云盘 Employee Documents 上级目录内真实创建员工文件夹。profile字段name、email、department、manager、start_date、location、role；文件夹名称为员工全名，父目录为 Employee Documents 的实际 token；ticket字段summary=员工全名、start_date、department、status=Not Started。每人邮件欢迎信息含姓名、Role、Department、Manager、Start Date、Location；未提供报到时间和详细地点，明确待经理确认，不编造。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-03-22T09:00:00Z 为时间基准。
