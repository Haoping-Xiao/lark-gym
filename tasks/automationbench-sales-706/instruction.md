查deal-ops当前创建请求，为对应账户建立deal room，关联商机、金额和stage并按指南添加该账户联系人。DocuSign workspace改deal_rooms及deal_room_members飞书台账，room_key为Account ID，成员用email关联、role按指南，另记录member_id=ou_eval/role=owner作为创建者（不计外部联系人数）。这是模拟业务空间及权限台账，不声称创建真实DocuSign或飞书文档ACL。只处理创建请求，不顺带执行另一个账户的旧文档更新，完成后原群确认workspace名称、金额和加入联系人数量。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

当前时间固定为 2026-02-24T09:00:00Z。
