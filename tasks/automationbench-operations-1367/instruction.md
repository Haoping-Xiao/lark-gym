处理停车位申请，读取 ss_parking 全部政策、车位与资历表，并核对设施管理最新通知。按 Rank 从小到大分配给有效申请人，已有车位不重复分配；Handicap 仅 Accessibility=Yes，Reserved 仅 Director 及以上，Standard 通用。先为符合条件者匹配专用类型以保留普通车位，同类型取编号最小可用位；跳过维护或其他限制车位和不合格员工。更新 ws_spots 的 Assignee，逐人邮件车位编号和类型。在 office-ops 群汇总所有新分配、数量和整体利用率；分母为全部 Status=Active 车位，百分比四舍五入到整数。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-09T09:00:00Z 为时间基准。

邮件的 internal_date=0 表示来源未提供时间，不代表该邮件发生于 1970 年；请结合材料内容及明确日期判断。
