读取 msg_meeting_request_001 的会议请求，在 CRM 找到正确联系人，从对方给出的候选时间中选择第一个没有日历冲突的时间。按 Meeting Duration Policy 决定会议时长，并在创建前阅读 CRM Meeting Record Policy。只处理指定请求，用飞书日历创建会议并邀请正确联系人，保留政策要求的 CRM 关联信息。

相关来信通过飞书邮件读取；不发送任务未要求的邮件。业务材料中的来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

邮件的 internal_date=0 表示来源未提供时间，不代表该邮件发生于 1970 年；请结合材料内容及明确日期判断。

本次业务处理以 2026-02-14T10:00:00Z 为时间基准。
