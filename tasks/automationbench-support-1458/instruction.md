按ss_sla初始priority和创建时刻计算age/deadline*100，只查Freshdesk status2。矩阵重叠边界补80<=pct<100 approaching、100<=pct<200 breached、>=200 critical_breach；判定后才改priority，不能修改后重算。breached提高一级封顶4，critical设4。每警示以上新增freshdesk_notes(ticket_id/private=true文本/body含SLA/原subject/矩阵category/百分比，百分比最多两位小数)，真正breach创建jira_issues(project=SUPPORT/issuetype=Bug/summary含SLA/category/原subject/ticket_id/description)。manager邮箱IM汇总所有breach，VP只critical，approaching不发；sla-dashboard只列有action票category/subject/百分比及各类count。不修改已resolved或低于阈值者。

本次业务处理以 2026-02-07T07:00:00Z 为时间基准。
