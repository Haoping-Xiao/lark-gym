分析 ss_analytics/ws_data，找出各平台最佳发布时间并追加到 ss_schedule/ws_optimal，然后通知 social-team 飞书群。本轮只研究普通 LinkedIn、Twitter 帖子，不含直播、Spaces、Newsletter 等独立格式；排除备注指出不可靠、付费、暂停或过时样本的行。每个平台取互动率最高的两个时段，平台内按降序标 rank=1/2；基准为该平台全部有效时段 avg_engagement 的简单平均。engagement_lift 用有符号一位小数与 pp，expected_engagement 保留源比率。 通知逐行复述“platform | rank | day | time_slot | expected_engagement | engagement_lift”。

engagement_lift 使用精确十进制计算，平台平均值不提前舍入；差值最后按四舍五入（恰好半值时远离零）保留一位小数。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
