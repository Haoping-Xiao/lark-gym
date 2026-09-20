按ss_merge candidates及do-not-merge执行组织合并。允许项把所有source工单（含solved）organization_id改target，不改其他字段；source追加merged-archived；target notes保留原文并追加source组织名。空source也完成归档。保留source实体便于审计，不自行合并domains或用户。每候选ws_results写Tickets Transferred文本与Status=Completed/Skipped，被阻止则0，不改其实体。ops-merges报告Batch_Reference、允许merge数/实际工单数/skip数、已合并双方名称与逐项票数，不列禁止对象名称。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_merge：Org Merge Tracker；工作表 ws_candidates（Merge Candidates）, ws_dnm（Do Not Merge）, ws_results（Merge Results）, ws_config（Report Config）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-24T09:00:00Z。
