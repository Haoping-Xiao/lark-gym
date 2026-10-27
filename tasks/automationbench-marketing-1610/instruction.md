执行 Prism 2.0 今日发布传播，从已批准内容表获取材料，应用最后修改并在发布前与渠道团队协调时间。不能发布的向 content-team@company.example.com 请求重新批准；可发布内容执行到相应渠道，社交内容发布至 Facebook，邮件内容群发，更新来源状态，最后向 launch-ops@company.example.com 汇总。飞书适配使用 facebook_pages_posts（page_id、message、status）与 content_queue（content_id、headline、channel、status）队列，Email 通过原生邮件发送；源只提供标题，不补造正文。状态可选 Queued、Sent、Needs Re-approval，队列不等于真实外部发布。引用来源值时原样保留，不改写或取整。

来信读取及向邮箱地址发送通知均使用飞书邮件；手机号及员工账号对应的通知使用已提供的飞书私聊，群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-01-27T12:00:00Z 为时间基准。
