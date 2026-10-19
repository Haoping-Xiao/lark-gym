处理内部转岗请求，将卡片移至适当列表并添加转岗详情评论，通知有关经理。Trello 卡片适配为 transfer_cards 飞书台账，字段为 card_id、employee、list、comment，关联已有来源 Card ID，list 可选 Approved、Denied。引用来源值时原样保留，不改写或取整。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-03-20T09:00:00Z 为时间基准。
