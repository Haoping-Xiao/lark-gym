今天是 2026-02-10。按 Quote Conversion Rules 及当前豁免把有效 ACCEPTED 报价转为 xero_invoices 飞书记录。接受后的报价价格不改，过期和非接受报价不转、不通知。新发票字段 quote_id、quote_number、contact_id、contact_name、total（数值）、due_date=今天后30天、status=AUTHORISED；需重新报价者本轮只保留待处理，不创建未经签署新价格。向每个成功客户飞书私聊确认名称、报价号、Invoice total 美元千位逗号、Due日期；保留源报价。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

当前时间固定为 2026-02-10T09:00:00Z。
