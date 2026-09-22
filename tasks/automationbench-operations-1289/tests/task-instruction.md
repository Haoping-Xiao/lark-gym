只看ENABLED广告，projected=spent_this_month+daily_budget*days_remaining，比例projected/monthly_budget按一位小数。严格>110%为CRITICAL立即把google_ads_campaigns状态改PAUSED；>100%且<=110%为WARNING不暂停。按每个flagged campaign在ss_budget_log/ws_alerts追加Campaign/Projected/Monthly Budget/Percentage/Level，全部汇总私聊marketing-director@company.example.com，保留名称和一位百分比及告警等级。无alert或原PAUSED不通知不改。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
