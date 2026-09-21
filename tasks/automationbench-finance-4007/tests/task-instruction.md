读取 expense-submissions 群的报销凭据，先核对 Expense Policy，再把合格项写入 Expense Tracker/Submissions。金额保留两位小数但不带美元符号，除 Amount、Category 外保存 Date、Description、source_message_id。超过每人餐费上限但缺人数的请求不能登记，需补人数；被拒类别按政策说明。逐原请求在同一飞书群发确认或拒绝说明，正文保留 source_message_id，此环境用来源关联群消息替代原平台线程回复。

# 操作环境

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_exp_tracker：Expense Tracker；工作表 ws_submissions（Submissions）, ws_policy（Expense Policy）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-05T14:00:00Z。
