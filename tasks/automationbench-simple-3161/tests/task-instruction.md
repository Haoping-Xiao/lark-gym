阅读客户合同咨询来信，在飞书 tickets 工单台账创建工单，subject 和 description 分别保留原来信标题、正文，group_id 选择 Legal Team 的业务 ID。私聊回复客户确认已收到咨询，首行为 Re: 加原邮件标题。

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
