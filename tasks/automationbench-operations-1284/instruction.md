从 ss_tradeshow_leads/ws_leads 检查尚未资格评估的展会潜客，并查销售团队近期影响资格的邮件。为合格者创建 HubSpot 联系人，将高价值潜客优先加入 deal pipeline，向 sales@company.example.com 汇总资格分类及可建交易者总 pipeline value。HubSpot 适配为 contacts（name、email、company、company_size、budget、qualification）及 deals（dealname、amount、contact_email、qualification）；qualification 可选 Hot、Warm、Cold。引用来源值时原样保留，不改写或取整。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
