今天是 2026-02-15。按 Bad Debt Write-Off Policy 筛选候选，所有条件必须满足，金额严格低于50000。合格项在源表新增 Write-Off Status=Written Off，并创建 bad_debt_writeoffs 飞书台账（invoice_number、customer、amount数值、date）；逐指定销售私聊，并在 finance-alerts 和 cfo@company.example.com 汇总。破产项向 legal@company.example.com 转交且不核销，不给其销售发通知。其他不合格行不动。汇总逐行 Customer | Invoice # | 原Amount，加 Total write-off | 合计。

# 操作环境

使用本环境的 Mock 版 lark-cli。业务资料按实体分别存入飞书多维表格，表目录见下方。记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_bad_debt：Bad Debt Review；工作表 ws_candidates（Write-Off Candidates）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-15T09:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_d6535dc405fa：bad_debt_writeoffs（来源实体 bad_debt_writeoffs）
