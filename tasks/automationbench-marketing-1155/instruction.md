今天是 2026-01-27，取消明天的 webinar。结合 ss_wbnr 报名表和事件负责人的取消 SOP，用飞书私聊通知所有报名者，更新 hubspot_contacts 联系人状态和取消日期，通知 events 群并完成后续退款与总结流程。源资料没有活动名，本轮统一使用 Webinar Management webinar，不虚构名称或实际退款。CRM 字段 webinar_status 与 cancellation_date；退款申请使用 hubspot_tickets，subject、description、assigned_team。按 SOP 顺序执行，汇总使用英文计数标签 registrants、premium registrants，金额原文保留。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

HubSpot 集合对应 hubspot_ 加原集合名，记录 ID 为 rec_hubspot_ 加原 ID；properties 内属性展开为同名台账字段。

飞书电子表格目录：

- ss_wbnr：Webinar Management；工作表 ws_reg（Registrants）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-01-27T12:00:00Z。
