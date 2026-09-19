阅读新项目来信，在飞书 Projects 台账登记项目名称 Name 和状态 Status，collection 为 Projects。

客户资料更新通知位于飞书群 oc_updates，请从消息中读取信息。

业务台账位于飞书多维表格 base_crm / tbl_crm。记录 ID 为 rec_ 加原业务 ID；collection 字段区分 contacts（联系人）、leads（线索）、opportunities（商机）、campaigns（活动）、cases（工单）、tasks（跟进事项）、notes（备注）、events（会议历史）、deals（商机）、accounts/companies（客户公司）、issues（研发工单）、cards（看板卡片）；lookup_ 开头的记录是只读查找资料。字段名及需要精确写入的数据保留原文。只新增或更新任务要求的数据，不修改其他数据，也不发送额外消息。

使用本环境提供的 Mock 版 lark-cli，通过 base、im 等正常业务命令完成任务。可用 --help 查询命令。不要直接访问 HTTP、后端文件、参考解或评分器。所有业务数据必须通过 CLI 读取。

当前时间固定为 2026-02-24T09:00:00Z。
