核对Equipment和Inspectors，选择Overdue中Risk Score最高设备及Available且Certification匹配的检查员。原Calendly改cal_ops飞书日历，2026-02-03 09:00 UTC、时长取Equipment Inspection配置，邀请检查员。创建inspection_schedule(applicationId=base_equipment/tableName=Inspection Schedule/Equipment/Inspector/Date/Status=Scheduled)及飞书文档(父目录=pg_inspections/title=设备名/content含设备、检查员、原Risk Score及UTC窗口)。邮件facilities@company.example.com和facilities群同样安排，不改变源设备检查完成状态。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-01T09:00:00Z 为时间基准。

文档必须通过飞书 Docs 创建，使用 Markdown 内容；不在 Base 表里登记页面来替代文档。本题将原目录映射为飞书云盘目录 pg_inspections。 可用 docs +create / +fetch / +update，均指定 --doc-format markdown；云盘目录使用 drive files list 查询。
