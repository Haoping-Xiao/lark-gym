按ss_move_plan任务政策选择下一Phase 1 Floor Plan Signoff，创建飞书Base asana_tasks和basecamp_todos。Asana workspace=ws_ops/project=proj_move、section查Planning、tag=Move、name及dueDate取源Task/Due；Basecamp account=acct_ops/project=proj_move/todo_set=set_move/todo_list=list_signoff、content及due_on用同一行原文。遇到disputed行按policy向legal-ops@company.example.com询问状态，不替Legal认定解除争议，不影响其他可安排行。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_move_plan：Move Plan；工作表 ws_tasks（Tasks）, ws_policy（Move Task Policy）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-24T09:00:00Z。
