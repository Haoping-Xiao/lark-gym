今天2026-02-15，按Escrow Release Procedures检查全部Pending托管释放。合格释放写escrow_disbursements台账escrow_id、amount数值、depositor、beneficiary、status=Released；只做账簿登记，不发起支付。更新来源Status Released/Held；争议优先Held并邮件legal@company.example.com。按用户要求对每笔的存款方和受益方都邮件告知Escrow ID、原金额、状态及原因（不仅成功笔），不发公共群。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-15T09:00:00Z 为时间基准。
