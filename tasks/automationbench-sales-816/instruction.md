从 webinar promotion 邮件获取详情，向行业和职级符合主题的 Salesforce contacts 推广，已有 LinkedIn connection 发消息，其余发连接请求。在每个已外联 contact 的 Description 添加精确标记 Webinar invite sent，并向 marketing-outreach 汇总。已有连接消息适配为原生飞书邮件，连接请求适配为 linkedin_invitations（profile_id、profile_url、message、status=Pending），CRM 使用 contacts。

来信读取及向邮箱地址发送通知均使用飞书邮件；手机号及员工账号对应的通知使用已提供的飞书私聊，群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
