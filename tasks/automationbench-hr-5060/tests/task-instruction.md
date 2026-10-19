今天2026-03-20，读取Recruiting Metrics，为每位经理邮件汇总其全部open roles。逐Role保留Days Open、Candidates at Interview、Total Applicants、Spend、Priority原值，计算Cost per applicant到两位美元。仅当Days Open严格超过45且Interview人数少于3时标at risk，其余写正常，不改来源表。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-03-20T09:00:00Z 为时间基准。
