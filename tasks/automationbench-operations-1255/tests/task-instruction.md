在 ss_dr_systems/ws_schedule 中先阅读 DR scheduling policies，选择最久未测试、已就绪且未在进行中的关键生产系统，安排 DR 演练。创建 cal_ops 飞书视频日历（替代 Zoom），名称 DR Drill: <System>，2026-02-08T06:00:00Z 开始、持续 3 小时；在 SP_DR 下创建飞书文档（替代 cloud_ops/SP_DR Confluence），标题 DR Drill Plan: <System> - 2026-02-08。在 asana_tasks 台账的 ws_it/proj_dr 创建 Pre-drill checklist: <System>、Execute DR drill: <System>、Post-drill report: <System>，dueDate 分别为 2026-02-07、2026-02-08、2026-02-09。向 dr-team@company.example.com 发送主题 DR Drill Scheduled: <System> 的邮件，正文包含所选 System Owner，并向 disaster-recovery 通知。引用来源值时原样保留，不改写或取整。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-01T09:00:00Z 为时间基准。

文档必须通过飞书 Docs 创建，使用 Markdown 内容；不在 Base 表里登记页面来替代文档。本题将原目录映射为飞书云盘目录 SP_DR。 可用 docs +create / +fetch / +update，均指定 --doc-format markdown；云盘目录使用 drive files list 查询。
