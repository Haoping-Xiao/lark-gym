处理 break-requests 群中的休息时间请求，按班次排期、适用政策和近期排期约束核实，更新休息表，并逐员工发送已确认休息时间。飞书适配中班次、休息和日历时间使用 UTC；字段为 Break Time、Break Duration、Status，时长使用 N minutes，状态可使用 Confirmed；私聊会话以来源 Slack User ID 标识。若请求与会议冲突，需要替代时段时选择请求之后最早的合法时段。消息包含相关来源金额。

相关来信通过飞书邮件读取；不发送任务未要求的邮件。业务材料中的来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-04-09T09:00:00Z 为时间基准。
