今天是 2026-02-01，按 IC Transfer Procedures 与最新明确批准/纠正处理二月公司间划转。Treasury 对本批次汇率批准有效；本题将 Controller 的最终金额更正视为本批次该金额已确定，不再沿用旧的待人数确认备注。每笔划转先在 ic_transfers 飞书台账记录 ref、from_entity、to_entity、currency、amount数值、fx_rate数值、usd_amount数值、description；再向接收方Contact发邮件，含原描述、Ref、原币金额与统一 Transfers total: $X；该笔通知后才把对应来源Status设Processed，同时回写获批金额/汇率更正。本次只做账簿登记。

来信读取及向邮箱地址发送通知均使用飞书邮件；手机号及员工账号对应的通知使用已提供的飞书私聊，群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-01T10:00:00Z 为时间基准。
