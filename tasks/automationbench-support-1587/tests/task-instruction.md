按ws_details的Account_ID连接工单，含Closed且按created_at升序建journey，未关联账户不按联系人臆造账户。原题只有标签无阈值，本题公开判断：取消/离开迹象或多个未解决High事件为Critical/Worsening；历史High已解决、近期仅Low且积极询问为Healthy/Improving；持续普通低风险或刚入门样本少为Healthy/Stable；其他持续未解决Medium为At Risk。ws_journey每已关联表内账户一行，Notes含判断依据及全部时间线（原created_at/ID/subject），使用配置允许标签。只有At Risk/Critical向对应CSM飞书邮件提醒，不通知客户/健康账户；account-insights汇总全部分析账户数量、Trend/Health与依据。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-09T09:00:00Z 为时间基准。
