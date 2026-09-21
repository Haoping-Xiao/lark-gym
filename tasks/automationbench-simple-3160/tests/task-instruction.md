阅读新同事欢迎来信，在飞书 contacts 台账创建联系人，first_name、last_name、email、title 从来信提取，company 使用 Acme Corp。

客户资料更新通知位于飞书群 oc_updates，请从消息中读取信息。

# 操作环境

业务资料按实体分表，表目录见下方。字段名保留原文。只新增或更新任务要求的数据，不修改其他数据，也不发送额外消息。

使用本环境提供的 Mock 版 lark-cli，通过 base、im 等正常业务命令完成任务。可用 --help 查询命令。不要直接访问 HTTP、后端文件、参考解或评分器。所有业务数据必须通过 CLI 读取。

当前时间固定为 2026-02-24T09:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_bc62a3c14fec：客户公司（来源实体 accounts）
- tbl_aa5af4084f37：联系人（来源实体 contacts）
