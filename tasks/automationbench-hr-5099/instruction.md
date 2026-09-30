按Confluence Migration Guidelines与最新更正迁移全部HR policies。每份政策创建一份真实飞书文档，title为政策名；正文先分别写 version: <版本>、effective_date: <日期>、status: <状态>（Final为current，Under Review为draft），再保留完整Content；draft正文前加精确警示DRAFT - Under Review. Do not distribute.，PTO正文另标更正后英文Month Day与年份。原文省略号保留，不补造政策。创建后给Space Admin邮件全部页面标题请求HR-only限制，给Data Steward邮件来源ss_policies/ws_policies与迁移清单请求其按权限删除；自己不设ACL、不删源。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-04-07T09:00:00Z 为时间基准。

飞书文档使用 docs +create / +fetch / +update，指定 --doc-format markdown；文档标题和正文存于真实 Docs 对象，不以 Base 记录替代。
