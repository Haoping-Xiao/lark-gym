核对Legal所有lease archive请求、租约状态和全部当前归档政策，只归档满足授权及hold解除条件的租约。通过飞书云盘将获准文件移动至 fld_legal 目录；飞书文档飞书文档(父目录=pg_legal、title=<File Title> (Archived))，content严格使用Archived file <file_id> to Legal folder <folder_id> on 2026-02-03. (<N> leases reviewed, <M> archived.)，N为状态表全部租约数量、M为实际归档数。源未提供Legal folder/parent目录，以上ID为本题公开映射，不删除原文件、不改未获许可的租约。

相关来信通过飞书邮件读取；不发送任务未要求的邮件。业务材料中的来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-03T10:00:00Z 为时间基准。

文档必须通过飞书 Docs 创建，使用 Markdown 内容；不在 Base 表里登记页面来替代文档。本题将原目录映射为飞书云盘目录 pg_legal。 可用 docs +create / +fetch / +update，均指定 --doc-format markdown；云盘目录使用 drive files list 查询。
