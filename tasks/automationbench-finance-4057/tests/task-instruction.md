按 Received Payments 与 FX Rates 记录四月已到账的国际付款，汇率是每美元外币数，因此 USD Equivalent=Amount/Rate。只为当前 AUTHORISED 的 xero_invoices 建 xero_payments 飞书记录，字段 invoice_id、invoice_number、currency_code、amount 数值、usd_equivalent 数值、date=今天；同时扣减发票 amount_due（字符串），结清设 status=PAID。跳过 VOIDED/DRAFT 的付款行，保持其发票和付款原样，也不向这些客户发送通知；只汇报本轮实际处理的项目，不列举或解释跳过项。逐客户发飞书私聊包含客户、发票、原币金额与 USD 折算；原数字照录并附千位逗号展示，本轮仅记录已有付款。

本次业务处理以 2026-04-12T09:00:00Z 为时间基准。
