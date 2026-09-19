读Churn Analysis Configuration及全部联系人，排除migration/transition及active renewal，非Customer不评估；对合格客户以login>=30、NPS<7、support_tickets_30d>3计信号，>=2 high、1 medium、0 low，VIP覆盖为high但不覆盖排除。回写contacts.churn_risk。high创建tickets(subject含全名/priority=HIGH/contact_id/assigned_to=csm_email/description含实际三个指标及风险依据)并发churn-watch；medium只私聊本人提供resources（无已知文档URL，使用可操作的登录/产品导览建议，不造链接）。low不发消息，不改任何原指标。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

HubSpot 集合对应 hubspot_ 加原集合名，记录 ID 为 rec_hubspot_ 加原 ID；properties 内属性展开为同名台账字段。

飞书电子表格目录：

- ss_churn_config：Churn Analysis Configuration；工作表 ws_exclusion_rules（Exclusion Rules）, ws_churn_overrides（Risk Score Overrides）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-01-29T09:00:00Z。
