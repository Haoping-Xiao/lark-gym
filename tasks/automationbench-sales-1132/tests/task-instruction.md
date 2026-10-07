按Account Health Scoring Methodology做Enterprise季度体检，结合源资料里的有效分层更正。Zoom/LinkedIn历史信号已转飞书台账，只读；邮件活跃度无时间窗则统计提供的直接往来，会议用最近30日，Completed task用due_date作为源中唯一活动日期核验最近7日。将description追加Health Score=N和Classification标签；按行动表建tasks，related_to_id关联Account，status=Not Started；Critical任务priority=High，其余Normal。分别发告警和account-health摘要，列每家分数分类及各类总数，不代管理员更新tier。

相关来信通过飞书邮件读取；不发送任务未要求的邮件。业务材料中的来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

邮件的 internal_date=0 表示来源未提供时间，不代表该邮件发生于 1970 年；请结合材料内容及明确日期判断。

本次业务处理以 2026-02-18T12:00:00Z 为时间基准。
