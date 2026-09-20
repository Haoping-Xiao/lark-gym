跨Re:amaze unresolved和Freshdesk开放票(status2/3)去重，先用contact邮箱及ss_dedup/ws_aliases确认为同一客户，再核对subject/正文是否同一问题；同客户不同问题、同问题不同客户均不能合并。重复项Re:amaze标resolved并新增内部reamaze_notes(conversation_id/author_type=staff/body含Freshdesk ID/internal=true文本)；Freshdesk新增私有freshdesk_notes(ticket_id/body含Re:amaze ID/private=true文本)，原状态不变。ws_log每对写Reamaze ID/Freshdesk ID/Email=原Re:amaze邮箱（保留alias）/Status=Deduplicated。无匹配不动、不发外部回复。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_dedup：Dedup Tracking；工作表 ws_log（Dedup Log）, ws_aliases（Email Aliases）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-24T09:00:00Z。
