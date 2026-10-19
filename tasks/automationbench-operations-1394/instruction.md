今天为 2026-02-09，审计 ss_cylinders/ws_inventory 中气瓶水压测试，基础要求为 Last Hydro Test 后每 5 年。Empty 应交供应商而非测试，不为其建测试票；Rental 由租赁公司测试，跳过；仅处理 Company-Owned 且 Full 或 Partial。为每个逾期气瓶在 SAFETY 创建 Hydro Test Required - [Cylinder ID] 工单，包含气体、地点及上次测试日期，并按 ws_safety_officers 向对应地点安全官邮件名单。Jira 适配为 jira_issues（project、issuetype、summary、gas_type、location、last_test_date），本任务只登记测试请求。引用来源值时原样保留，不改写或取整。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-09T09:00:00Z 为时间基准。
