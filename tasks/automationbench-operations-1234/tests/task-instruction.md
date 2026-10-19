发布当前 after-hours call tree 并通知团队。查看 playbook versions 表及 publishing policy 工作表的发布要求，在 pg_ops 下创建飞书文档（替代 Notion），内容包含所选版本和生效日期，并向 ops-updates 通知已发布。源未提供具体联系人时，只发布可获得的版本详情。引用来源值时原样保留，不改写或取整。

相关来信通过飞书邮件读取；不发送任务未要求的邮件。业务材料中的来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。

文档必须通过飞书 Docs 创建，使用 Markdown 内容；不在 Base 表里登记页面来替代文档。本题将原目录映射为飞书云盘目录 pg_ops。 可用 docs +create / +fetch / +update，均指定 --doc-format markdown；云盘目录使用 drive files list 查询。
