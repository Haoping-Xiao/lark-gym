从 HubSpot 获取有 lead_score 的联系人，按 lead sync rules 中评分档位同步到主 Mailchimp audience，确保每人只有一个正确 temperature 标签，移除错误温度标签；完成后登记 sync log 工作表。HubSpot 适配为 contacts，Mailchimp 适配为 mailchimp_subscribers（list_id、email、tags JSON 数组）。日志使用 Email、Score、Temperature、Action，Action 可选 Synced、Removed。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
