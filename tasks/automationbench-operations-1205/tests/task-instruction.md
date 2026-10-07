查ops@company.example.com最新vendor checklist归档来信，从飞书云盘的文件与目录识别正确文件及Archived Vendors文件夹。用 drive +move 将文件移至目标目录，并建飞书文档(父目录=pg_ops、title保留文件原名、content记录Archived及file/目标folder)。文件和文档均使用飞书云盘原生对象，不操作外部文件、不改其他版本。

相关来信通过飞书邮件读取；不发送任务未要求的邮件。业务材料中的来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。

文档必须通过飞书 Docs 创建，使用 Markdown 内容；不在 Base 表里登记页面来替代文档。本题将原目录映射为飞书云盘目录 pg_ops。 可用 docs +create / +fetch / +update，均指定 --doc-format markdown；云盘目录使用 drive files list 查询。
