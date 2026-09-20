使用 Open Foreign Currency Invoices 和 Current Rates 计算未实现汇兑损益。该表汇率为每单位外币的美元数，以外币金额×当前率得到美元估值，和 USD at Booking 比较，资产增值为Gain、减少为Loss。给 controller@company.example.com 发飞书私聊，逐行 Invoice | Customer | Currency Foreign Amount | Booking $值 | Current $值 | Gain/Loss $值，附 Net unrealized gain/loss。只报未实现影响，不登记实收或修改汇率。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_fx_impact：FX Impact Analysis；工作表 ws_open_fx（Open Foreign Currency Invoices）, ws_current_rates（Current Rates）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-15T09:00:00Z。
