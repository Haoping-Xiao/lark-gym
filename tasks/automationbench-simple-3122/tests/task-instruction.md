请先读取客户通知群中的相关来信。请在飞书多维表格看板台账中创建一条 cards 记录。先读取看板列表映射，找到目标列表。目标列表名称为 To Do，list 字段使用查到的列表 ID。其他字段按以下要求填写：{"board": "brd_mktg", "name": "Onboard new agency partner"}。

客户资料更新通知位于飞书群 oc_updates，请从消息中读取信息。

# 操作环境

业务资料按实体分表，表目录见下方。字段名保留原文。只新增或更新任务要求的数据，不修改其他数据，也不发送额外消息。

使用本环境提供的 Mock 版 lark-cli，通过 base、im 等正常业务命令完成任务。可用 --help 查询命令。不要直接访问 HTTP、后端文件、参考解或评分器。所有业务数据必须通过 CLI 读取。

当前时间固定为 2026-02-24T09:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_6ac9a32c0ca8：看板卡片（来源实体 cards）
- tbl_4ff873f55e54：lookup_board_list（来源实体 lookup_board_list）
