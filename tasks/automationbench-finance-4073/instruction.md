今天是 2026-02-01。按 Client Statement Policy 汇总 wave_invoices 未付余额，客户总额≥100才发飞书私聊。列每张未付 Invoice # | invoice_date | 原invoice_amount_due | Age N days，并报 Total balance 和0-30、31-60、61-90、91+ days金额。源无到期日，本题账龄明确按 invoice_date 至今天计算，并非逾期天数；金额汇总美元千位逗号。不得包含已付发票、改变客户或发票状态。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

当前时间固定为 2026-02-01T09:00:00Z。
