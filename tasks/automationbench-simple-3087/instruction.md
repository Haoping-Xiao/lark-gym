Kwame Asante 发来客户咨询消息。请找到消息，在飞书电子表格 Contact Log（ss_contacts / ws_log）新增一行，记录 Name、Email、Subject 和 Date；Date 使用 YYYY-MM-DD 格式。

使用 Mock 版 lark-cli 的 sheets 业务命令读写电子表格，使用 im 业务命令读取消息。需要查找的来信已同步到 oc_updates 通知群，消息中保留来源联系人、标题、日期和正文。第一行为字段名；先读取表格，再在末尾追加或更新指定单元格，不改变其他内容。可用 --help 查询命令；不得直接访问 HTTP、后端文件、参考解或评分器。

当前时间固定为 2026-02-24T09:00:00Z。
