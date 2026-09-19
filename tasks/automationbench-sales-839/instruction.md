按Lead Scoring Playbook与最新政策对当前leads计分和路由。Calendly历史在calendly_scheduled_events/invitees台账，以email关联线索；每个互斥区间只取对应档，不叠加within48h与within1week。写lead_score，按阈值改status或追加description审计；所有状态说明包含分数，低分保留原status。根据Rep Routing Matrix查正确Slack用户并用飞书user_id对应私聊，取消与排除项完全跳过。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_lead_scoring_001：Lead Scoring Playbook；工作表 ws_rubric_001（Scoring Rubric）, ws_thresholds_001（Thresholds）
- ss_rep_routing_001：Rep Routing Matrix；工作表 ws_routing_ls（Score-Based Routing）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-24T09:00:00Z。
