Tomoko Ishida 发来关于 API 限流的咨询。请找到消息并通过飞书回复：标准套餐每分钟允许 1,000 次 API 调用，企业套餐每分钟 10,000 次，附文档链接 docs.brightpath.example.com/rate-limits。

# 操作环境

使用 Mock 版 lark-cli 的 im 业务命令完成任务。通过 im +chat-list --types=p2p,group 查找群和私聊会话，名称包含联系人姓名或电子邮件地址；传入对应 chat_id 发送消息。需要查找的来信已同步到 oc_updates 通知群。只向任务要求的会话发送一条消息，不更改原消息或其他业务数据。邮件标题放在消息首行，正文使用中文，保留专有名称、金额、日期及链接。不得直接访问 HTTP 或后端文件。

当前时间固定为 2026-02-24T09:00:00Z。
