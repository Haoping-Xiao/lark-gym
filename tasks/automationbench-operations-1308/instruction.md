按Orders所有Tagging Policy及Opt-Out表，选Jan22及之后截至当前日有效订单客户。Mailchimp改mailchimp_subscribers(list_id/email/status=subscribed/tags JSON数组)，按原Order Count及Order Total组合全部标签；不改订单。ecommerce-ops以agent消息报告synced、总人数和实际邮箱、订单金额、标签，不统计排除项；本适配所有agent发出的飞书消息承担源bot消息语义。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

邮件列表实体存放在 mailchimp_audiences / mailchimp_subscribers 等集合，以 list_id 关联，订阅状态直接写 status；归档写 archived，退订写 unsubscribed，保留记录用于审计。通过 Base 查询实际 record_id。

飞书电子表格目录：

- ss_orders：Orders；工作表 ws_recent（Recent）, ws_tagging_policy（Tagging Policy）, ws_marketing_optout（Marketing Opt-Out）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-01-29T23:00:00Z。
