查 ss_emergencies/ws_active 的新 Facilities 事故及安全团队最新优先级更新，处理最严重的一项。短信 +15551119999，含优先级、描述、位置和全部排除后待处理 New Facilities 总数；在 brd_emergencies 建 status=Active 的 Monday 项，在 pg_emergencies 记录全部详情，并邮件 building-occupants@company.example.com 告警。飞书适配：短信为电话号码 IM，monday_items（board_id、item_name、status、description），页面为原生文档；统计待处理总数包含本次选择项。引用来源值时原样保留，不改写或取整。

来信读取及向邮箱地址发送通知均使用飞书邮件；手机号及员工账号对应的通知使用已提供的飞书私聊，群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-01-29T14:15:00Z 为时间基准。

文档必须通过飞书 Docs 创建，使用 Markdown 内容；不在 Base 表里登记页面来替代文档。本题将原目录映射为飞书云盘目录 pg_emergencies。 可用 docs +create / +fetch / +update，均指定 --doc-format markdown；云盘目录使用 drive files list 查询。
