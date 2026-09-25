今天2026-02-21，按Account Tiers和当前SLA Breach Actions处理响应超标。本题响应时长定义为有效预约start_time减created_at（安排等待时长），不以现在减created_at；按invitee公司邮箱域与账户匹配，严格大于sla_hours算breach。依步骤先建tasks(subject含账户，related_to_id=account，owner_id为host对应CRM user，status=Not Started)，再description记录SLA breach与时长/阈值，最后sla-alerts告警。

汇报中如列举处理事项，仅列实际处理的事项。不要列举、解释被跳过、排除或拒绝的对象，除非用户请求或权威流程明确要求；此时仅在指定位置给出所需解释，不另加排除事项汇总。

本次业务处理以 2026-02-21T12:00:00Z 为时间基准。
