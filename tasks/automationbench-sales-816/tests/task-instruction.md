读取webinar推广邮件，向匹配行业与级别的人推广。本飞书适配将CRM受众范围明确为Active contacts及Qualified leads，领导级别含Manager及以上（含Product Manager），不包括Analyst。已有LinkedIn connection改按邮箱映射的飞书邮件，非connection创建linkedin_invitations(profile_id/profile_url/message/status=Pending)，消息包含原主题、原日期时区和注册URL。处理过的contacts description追加精确Webinar invite sent，leads不修改，最后marketing-outreach总结invite/connect数量。

来信读取及向邮箱地址发送通知均使用飞书邮件；手机号及员工账号对应的通知使用已提供的飞书私聊，群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
