在飞书 Vendors 台账新增供应商：Name=CloudForge Inc.，Contact=Wei Zhang，Email=wei.zhang@cloudforge.example.com，Service=Cloud Infrastructure。

# 操作环境

业务资料按实体分表，表目录见下方。字段名保留原文。只新增或更新任务要求的数据，不修改其他数据，也不发送额外消息。

使用本环境提供的 Mock 版 lark-cli，通过 base、im 等正常业务命令完成任务。可用 --help 查询命令。不要直接访问 HTTP、后端文件、参考解或评分器。所有业务数据必须通过 CLI 读取。

当前时间固定为 2026-02-24T09:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_720b6017f2e9：Vendors（来源实体 Vendors）
