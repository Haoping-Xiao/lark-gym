今天2026-02-15，依据Invoice Sending Rules及客户暂缓请求，发送尚未送达且可发送的Xero发票。在飞书私聊向客户发送完整发票号、客户名称、原total、amount_due；CC CFO改为给cfo@company.example.com发同内容私聊。随后将已发送发票sent_to_contact设true，向billing群汇总真正发送的发票及金额，不把未发送发票混进汇总。原始账单记录中布尔值采用JSON文本true/false。

本次业务处理以 2026-02-15T10:00:00Z 为时间基准。
