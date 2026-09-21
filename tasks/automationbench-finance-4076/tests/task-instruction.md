今天是 2026-02-15。读取最新 Invoice Void Procedures、例外来信与 billing 群更正，按更新时间采用当前账龄窗口，部分收款及仍在催收/法务暂停者不作废。作废合格 quickbooks_invoices：voided=true（字符串）、total_amt/balance=0（字符串），void_memo 记录窗口、无收款及催收状态依据；保留原 note 和其他字段。逐分配销售发飞书私聊，billing 群汇总原客户、发票号、原金额及结果。只影响模拟账务。 void_memo 用 Over 210 days; no payments; 后加 no active collection case 或 outside counsel case dismissed 描述对应依据。

# 操作环境

使用本环境的 Mock 版 lark-cli。业务资料按实体分别存入飞书多维表格，表目录见下方。记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_sales_reps：Sales Rep Assignments；工作表 ws_assignments（Assignments）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-15T09:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_237255d7d526：quickbooks_customers（来源实体 quickbooks_customers）
- tbl_357692c6afde：quickbooks_invoices（来源实体 quickbooks_invoices）
