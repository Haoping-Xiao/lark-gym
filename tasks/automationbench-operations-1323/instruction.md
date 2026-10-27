今天为 2026-02-09，处理 ss_access_requests/ws_queue 中待办系统权限请求，用 ws_directory 核对申请人经理职级是否足以批准所申请访问级别，按 ws_provisioning_routing 路由处理，完全跳过已 Processed 请求。飞书适配使用 asana_tasks 台账（workspace、project、section、name、email、department、access_level）及邮件；台账表示配置任务，不等于实际授予权限。引用来源值时原样保留，不改写或取整。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-09T09:00:00Z 为时间基准。
