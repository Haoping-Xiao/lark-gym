分析 ss_analytics/ws_data 中帖子互动数据，找出各平台最佳发布时间，按互动表现排名更新发布计划。每行包含 engagement_lift，表示相对该平台平均值的百分点差，格式为 +X.X pp 或 -X.X pp，完成后通知社媒团队。飞书适配目标为 ss_schedule/ws_optimal，字段为 platform、rank、day、time_slot、expected_engagement、engagement_lift，通知使用 social-team 群。 原题未给 top 数量，本适配每个平台记录前两名，平台按普通 LinkedIn、Twitter 帖子范围解释。

engagement_lift 使用精确十进制计算，平台平均值不提前舍入；差值最后按四舍五入（恰好半值时远离零）保留一位小数。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
