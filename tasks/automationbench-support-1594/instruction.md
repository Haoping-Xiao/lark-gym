缺失当前时间，本题固定2026-02-09 12:00UTC。审核open/pending会话，closed跳过；按customer_email域映射Tier，未知域Standard。首响减created_at，无首响以固定现在计，严格超Target才breach。追加sla-breach，ws_breaches全部列，Customer用原customer_name、Status=Breached或No response；小时精确计算不四舍五入。按Escalation Email每收件人汇总一条IM，群只报breach，含Report_Reference、逐票原subject/客户名/Tier/target hours/actual hours/status，不报告正常或跳过票。

本次业务处理以 2026-02-09T12:00:00Z 为时间基准。
