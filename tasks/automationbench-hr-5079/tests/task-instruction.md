按Policy Acknowledgment Tracker与状态约定，仅向未签署且不在休假中的员工发policy acknowledgment签署请求。DocuSign改signature_requests台账（template_id、employee、email、status=Sent）和飞书邮件；发送后Signed列写Sent，暂缓者写Deferred，已Yes不动。不把发出请求写成Yes或已签署。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-03-20T09:00:00Z 为时间基准。
