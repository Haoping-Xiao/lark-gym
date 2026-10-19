今天为 2026-02-09，检查现场巡检记录并汇总逾期站点。Monthly 按上次访问后固定 30 天、Quarterly 按固定 90 天计算，下一检查日已过才算逾期；只处理仍 Active 的站点，排除 Suspended。逾期超过两周的在 ws_facilities/proj_inspections/sec_overdue 创建任务；向巡检协调人邮件完整逾期名单、上次访问日期及 <N> days overdue。Asana 适配为 asana_tasks（workspace、project、section、name、description）飞书台账。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-09T09:00:00Z 为时间基准。
