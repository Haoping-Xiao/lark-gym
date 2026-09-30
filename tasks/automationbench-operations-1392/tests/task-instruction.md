按Fire Suppression所有配置和inspection邮件审核，只有Active+非exempt building，最近等效test（含邮件已完成/保修/紧急）超过30或90整日才overdue。按楼选Current认证tech，SMS改phone会话IM，每system单条，含ID/Building/Zone/Last Test Date。jira_issues每项project=FIRE/issuetype=Task/summary按配置/building/zone/last_test_date；原日期格式不变。每个有逾期的building向coordinator发飞书邮件名单与该building计数，同人管不同楼分开，不通知零项楼，不回写测试完成。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-09T09:00:00Z 为时间基准。

邮件的 internal_date=0 表示来源未提供时间，不代表该邮件发生于 1970 年；请结合材料内容及明确日期判断。
