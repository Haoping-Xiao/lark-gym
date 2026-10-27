通过签署系统向离职员工发送遣散协议，并因政策切换作废其现有竞业禁止协议；发送前检查特殊遣散条款和法律暂停。DocuSign 适配为 signature_requests 飞书台账和邮件签署请求，字段为 template_id、employee、employee_id、email、Severance Weeks、benefits_days、status，状态可使用 Sent。本环境不连接真实签署平台。引用来源值时原样保留，不改写或取整；消息包含相关且统计对象明确的数量。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-04-07T09:00:00Z 为时间基准。
