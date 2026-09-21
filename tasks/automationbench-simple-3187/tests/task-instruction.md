阅读企业客户升级投诉来信，在飞书 tickets 台账创建 priority=high 的工单，subject 和 description 保留来信标题、正文；向 escalations 群发送警报并在正文标记 @Support Manager。此任务用文本标记表达经理提醒，不触发真实成员推送。

客户资料更新通知位于飞书群 oc_updates，请从消息中读取信息。

# 操作环境

业务资料按实体分表，表目录见下方。字段名保留原文。只新增或更新任务要求的数据，不修改其他数据，也不发送额外消息。

使用本环境提供的 Mock 版 lark-cli，通过 base、im 等正常业务命令完成任务。可用 --help 查询命令。不要直接访问 HTTP、后端文件、参考解或评分器。所有业务数据必须通过 CLI 读取。

使用 im +chat-list --types=p2p,group 查找接收群或私聊会话，再通过 im 业务命令发送消息。

当前时间固定为 2026-02-24T09:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_f883a4577cea：客服组资料（来源实体 lookup_groups）
- tbl_281832285f98：成员资料（来源实体 lookup_users）
- tbl_45a5c62241ee：客服工单（来源实体 tickets）
