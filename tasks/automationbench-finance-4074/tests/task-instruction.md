准备 January Trial Balance 的月结分录，按 Monthly Closing Procedures 先结转所有非零收入/费用，再将 Income Summary 净额结转 Retained Earnings。非损益科目及零余额不参与。保存 journal_entries 飞书台账，period=2026-01、debit_account、credit_account、amount数值、status=Prepared；本轮是备审分录，不改试算平衡原表。给 controller@company.example.com 发私聊，逐行 Debit 科目 | Credit 科目 | $金额，并列 Revenue total、Expense total、Net income。

# 操作环境

使用本环境的 Mock 版 lark-cli。业务资料按实体分别存入飞书多维表格，表目录见下方。记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_trial_balance：January Trial Balance；工作表 ws_tb（Trial Balance）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-01T16:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_2a299ed82e49：journal_entries（来源实体 journal_entries）
