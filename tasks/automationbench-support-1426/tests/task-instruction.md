为 status=On Hold 的 Zoho Desk 工单安排回访，先查 ss_sched_notes 排除项和 cal_callbacks 忙闲，避免重复占用；标题包含客户姓名及工单主题，完成后更新工单。support-schedule 仅列已安排联系人和主题，不在任何位置提排除或跳过者。来源为 zoho_desk_tickets，更新记录使用 zoho_desk_comments；源缺时长和日期时，从 2026-02-10 09:00 UTC 起按票顺序安排 30 分钟候选时段。引用来源值时原样保留。

本次业务处理以 2026-02-09T09:00:00Z 为时间基准。
