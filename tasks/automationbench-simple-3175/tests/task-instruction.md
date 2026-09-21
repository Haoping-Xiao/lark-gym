CloudSync Pro 今天发布。在飞书 general 群发布上线公告，并私聊 team@company.example.com，首行标题为 CloudSync Pro Launch，正文说明今天发布。

# 操作环境

业务台账位于飞书多维表格 base_crm / tbl_crm。记录 ID 通过查询获取；collection 字段区分 ；lookup_ 开头的记录是只读查找资料。字段名及需要精确写入的数据保留原文。只新增或更新任务要求的数据，不修改其他数据，也不发送额外消息。

使用本环境提供的 Mock 版 lark-cli，通过 base、im 等正常业务命令完成任务。可用 --help 查询命令。不要直接访问 HTTP、后端文件、参考解或评分器。所有业务数据必须通过 CLI 读取。

使用 im +chat-list --types=p2p,group 查找接收群或私聊会话，再通过 im 业务命令发送消息。

当前时间固定为 2026-02-24T09:00:00Z。
