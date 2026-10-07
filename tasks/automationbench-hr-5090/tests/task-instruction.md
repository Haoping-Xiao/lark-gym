按Quarterly Access Review Process和最新HR更正处理审查。Jira改security_review_tickets飞书台账，字段summary姓名、employee_id、project=SECREVIEW、department、manager_email作为路由、access_level、role_level、flag、priority（Terminated High，其余Medium）、status=Pending Manager Approval。只建审查单，不执行权限撤销、不广播。来源同步明确的部门/经理更正，以及已离职者Flag=Terminated、Status=Terminated；保留所有Access Level。

相关来信通过飞书邮件读取；不发送任务未要求的邮件。业务材料中的来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-04-07T09:00:00Z 为时间基准。
