今天2026-01-21，处理未来60天内到期的已签合同，结合champion LinkedIn状态和open support cases判断健康。按原要求健康账户约Renewal Discussion并存Draft Renewal Agreement；风险账户只建内部CSM review和High task，无续约合同；auto-renew不动作。会议使用primary飞书日历，原题未给时刻与时长，固定明天10:00–10:30健康续约、11:00–11:30内部review；源材料未提供CSM身份时内部日程只留组织者，不编造参会人。signature_requests包含template_id/template_name/account_id/recipient_email/status=Draft/amount，tasks关联风险account、status=Not Started/priority=High。每个需处理账户建renewal_talking_points(account_id/body)记录金额、到期日、关系依据及讨论建议，renewals汇总；保留原合同和机会状态。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

日程使用飞书 calendar 命令，日历 ID：primary。使用来源明确时区；未标时区按 UTC。

当前时间固定为 2026-01-21T10:00:00Z。
