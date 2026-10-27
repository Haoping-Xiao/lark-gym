处理 HR 发来的电话更新请求。找到 HR updates 团队最新批次邮件，将电话变更应用到匹配的 Salesforce 联系人，妥善处理冲突或重复，每项实际更新创建说明。Salesforce 适配为 contacts 和 notes 台账，notes.parent_id 引用联系人业务 ID，说明字段为 title、body。

相关来信通过飞书邮件读取；不发送任务未要求的邮件。业务材料中的来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

邮件的 internal_date=0 表示来源未提供时间，不代表该邮件发生于 1970 年；请结合材料内容及明确日期判断。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
