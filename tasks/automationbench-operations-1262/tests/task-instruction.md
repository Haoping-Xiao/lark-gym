处理Jan27–Feb2到期、Active且NDA Signed=Yes的合同中End Date最早者，同日Security Clearance High>Standard>None。DocuSign替换signature_requests(template_id/template_name/signer_email/cc_emails JSON数组/status=Sent)，向本人发签署请求，HR/Legal分别发送邮件副本。创建trello_cards(board=brd_hr/list=Offboarding/name=Offboard: <Name>)和飞书文档(父目录=pg_offboarding/title=Offboarding: <Name>/content)。通知hr-ops及源Manager ID对应用户，正文和页面保留End Date、Security Clearance、Equipment List。只是开始offboarding，不终止账号或声称签署完成。通知或记录引用来源值时须原样保留，不得改写或舍入。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-01-29T09:00:00Z 为时间基准。

文档必须通过飞书 Docs 创建，使用 Markdown 内容；不在 Base 表里登记页面来替代文档。本题将原目录映射为飞书云盘目录 pg_offboarding。 可用 docs +create / +fetch / +update，均指定 --doc-format markdown；云盘目录使用 drive files list 查询。
