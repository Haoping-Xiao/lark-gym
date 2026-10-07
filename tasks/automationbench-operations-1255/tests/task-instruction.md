阅读DR Systems及DR Scheduling Policy，从Critical/Production/Due/Ready且无未解决安全hold者选Last Test最早系统。原Zoom改cal_ops飞书视频日历DR Drill: <System>，2026-02-08 06:00 UTC3小时，源无参会人不猜。创建飞书文档(父目录=SP_DR/title=DR Drill Plan: <System> - 2026-02-08/body)，以及asana_tasks(workspace=ws_it/project=proj_dr/name/dueDate)三项：Pre-drill checklist/Execute DR drill/Post-drill report，各冒号后系统名，日期Feb7/8/9。邮件dr-team@company.example.com主题DR Drill Scheduled: <System>，并发disaster-recovery，页面/通知保留System Owner、Last Test、RTO、RPO及UTC窗口。只安排不执行恢复演练，不清除安全hold。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-01T09:00:00Z 为时间基准。

文档必须通过飞书 Docs 创建，使用 Markdown 内容；不在 Base 表里登记页面来替代文档。本题将原目录映射为飞书云盘目录 SP_DR。 可用 docs +create / +fetch / +update，均指定 --doc-format markdown；云盘目录使用 drive files list 查询。
