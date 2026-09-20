今天2026-01-21，为本周新入职业务联系人按NDA合规指南发送Mutual NDA。本次范围明确本周周一至今天，不因一封旧的经理转述擅自扩大为14日；实际已有envelope或CRM已Sent不重复，豁免、review hold与DO NOT contact按限制处理。DocuSign发送改signature_requests（contact_id/template_id/template_name/signer_name/email/status=Sent）及签署人私聊，成功后nda_status=Sent。只更新新发送者，不顺手回填其他历史记录；legal-ops报告本周发送数和本周already数量，不能混入窗口外联系人。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

当前时间固定为 2026-01-21T12:00:00Z。
