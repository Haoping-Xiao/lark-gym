依据 Wire Transfer Authorization Policy 处理 Pending 请求，核对金额档审批、国际电汇 CFO 审批和 Verified。审批/验证不足一律 Status=Pending Approval，不实际汇款。合格项创建 wire_transfers 飞书模拟电汇记录（request_id、payee、amount 数值、status=Sent），来源 Status=Sent 只表示模拟执行。给每名请求者发飞书私聊通知 Request #、Payee、原Amount、结果及缺项原因；不得声称真实银行已付款。

# 操作环境

使用本环境的 Mock 版 lark-cli。业务资料按实体分别存入飞书多维表格，表目录见下方。记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_wires：Wire Transfer Queue；工作表 ws_pending_wires（Pending）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-10T09:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_ed170c29e4d5：wire_transfers（来源实体 wire_transfers）
